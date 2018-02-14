(function(window, undefined){
	window.detection = window.detection || {};

	// минимальный процент пересечения двух rects 
	var SQUARES_INTERSECTION_MIN_PERCENT = 50;

	// Конструктор
	detection.Person = function(){
		var lifeTime= 0, // ms
			eyes = [],
			faces = [],
			mouths = [];
	};

	detection.persons = [];
	detection.suspectObjs = [];

	detection.findFace = function(rects) {
		var eyes = rects.filter(function(rect){
			return rect.typeOfArea == "eye";
		});
		var faces = rects.filter(function(rect){
			return rect.typeOfArea == "face";
		});
		var mouths = rects.filter(function(rect){
			return rect.typeOfArea == "mouth";
		});

		if(faces.length) {
			//console.log("calling faceViaFaces()");
            faceViaFaces();
        }
		else if(eyes.length) {
            //console.log("calling faceViaEyes()");
            faceViaEyes();
        }
		else {
            //console.log("calling faceViaEyes()");
            faceViaMouths();
        }

        return;
        /**
         * функция для определения лица при условии,
         * что есть хотя бы один найденный face.
         * Если их несколько, то обязательно проверяется
         * их пересечение, но если есть пересечение 10%,
         * то ничего страшного. Тогда после определения person,
         * удаляем области, которые ему пренадлежат и опять
         * запускаем faceViaFaces
         * стоит добавить данные функции в findFace, так как они
         * вызываются только оттуда, для того, чтобы избежать
         * ошибок с [[scope]]
         */
        function faceViaFaces(){
                // faces, eyes & mouths из [[scope]]
            var currentFaceArea = findAreaAndDelete(faces, "face");
            var areas = findIntersections(eyes.concat(mouths), 60, 100, currentFaceArea);

                // объединяем потому, что бибилиотека
                // достаточно часто определяет глаз как mouth
                // вызываем функцию нахлждения пересечений, определенной
                // площадью пересечения
            var intersections = findIntersections(areas,
                SQUARES_INTERSECTION_MIN_PERCENT, 100);
            if(intersections.length){
                console.log("intersections: ", intersections); // количесвто пересекаемых областей
                    // обновляем оригинальные массивы с областями, так как в них может быть
                    // добавлен параметр: есть пересечение, что играет важную роль для дальнейших вычислений
                updateRects(eyes, intersections);
                updateRects(mouths, intersections);
            }

        }
        /**
         * функция для определения лица при условии,
         * что есть области с типом "eye" и (или без) "mouth"
         */
        function faceViaEyes(){}
        function faceViaMouths(){}
	};
    /**
     * Метод сравнения: вычисление принадлежности новых областей
     * относительно существующих областей в persons
     * @param rects
     */
    detection.comparison = function(rects) {

    };

	/**
	* метод нахождения пересечений.
	*/
	var findIntersections = function(rects, MIN_INTERSECTION_SQ_PERCENT,
                                     MAX_INTERSECTION_SQ_PERCENT, searchArea){
		var xProjectionsArray = [],
			yProjectionsArray = [],
			intersections = [],
			result = [],
			i = 0;
        if(searchArea){
            xProjectionsArray[i] = searchArea.x;
            yProjectionsArray[i++] = searchArea.y;
            xProjectionsArray[i] = searchArea.x + searchArea.width;
            yProjectionsArray[i++] = searchArea.y + searchArea.height;
        }
		rects.forEach(function(rect){
			xProjectionsArray[i] = rect.x;
			yProjectionsArray[i++] = rect.y;
			xProjectionsArray[i] = rect.x + rect.width;
			yProjectionsArray[i++] = rect.y + rect.height;
		});
		// в данном цикле переменная i характеризует область,
        // относительной которой проверяются отсальные
        // области на факт существования общей площади (пересечения)
        var n = xProjectionsArray.length;
        if(searchArea)
            {n = 1;}
		for(var i=0; i<n; i=i+2)
		{
				// точки пересечения. Хранится индекс точки, 
				// чтобы было удобно потом сравнивать по Oy!
			var xIntersections = []; 
			for(var j=0; j<xProjectionsArray.length; j++)
				if(j!=i && j!=i+1)
						// проверка на принадлежность отрезку [i, i+1]
					if(xProjectionsArray[j]>=xProjectionsArray[i] &&
                        xProjectionsArray[j]<=xProjectionsArray[i+1])
							// добавление точки, которая принадлежит отрезку в 
							// соответсвующий массив
						xIntersections.push(j);
				// проходимся по всем элементам, которые имеют пересечение по 
				// Ox, для проверки, не пересекаются ли они по Oy
				// Если условия выполняются, то номер точки заночится в массив пересечений.
            intersections = [];
			for(var j=0; j<xIntersections.length; j++)
				if(yProjectionsArray[xIntersections[j]]>= yProjectionsArray[i] &&
                    yProjectionsArray[xIntersections[j]]<=yProjectionsArray[i+1])
					intersections.push(xIntersections[j]);
				// проверка на повторяющиеся элементы 
				// тк в массив были добавлены точки, которые относятся к Oy. 
				// Но если есть хотя бы одна точка в массиве, то rects пересекаются!

            intersections = unique(intersections);
			intersections = uniqueAreaIndex(intersections);
			intersections = onlyFirstValue(intersections);
			// количесвто пересечений относительно объекта i
			var numOfIntersections = 0;
            // вычисляем общую площадь найденный элементов,
				// которыйе пересекаются с текущим и проверяем с
				// минимально допустимой площадью
			intersections.forEach(function cycle(point){
			    if(cycle.stop) {return;}
				if(percentOfIntersectionSq(
				    intersectionSquare(point, i, xProjectionsArray, yProjectionsArray),
                        point, i, xProjectionsArray, yProjectionsArray) >= MIN_INTERSECTION_SQ_PERCENT){
					numOfIntersections++;
				    var res = rectEquivalent(rects, xProjectionsArray[point], yProjectionsArray[point],
                        xProjectionsArray[point+1]-xProjectionsArray[point],
                        yProjectionsArray[point+1]-yProjectionsArray[point]);
					res.intersectionWith = i/2; // индекс элемента, с которым есть пересечение/
				    result.push(res);
                    //cycle.stop = true;
				}
			});
			// в конце цикла i добавляем в результирующий массив саму область i,
            // в которой сохраняем количество пересечений
			if(numOfIntersections){
			    if(searchArea)
                    var res = rectEquivalent([searchArea], xProjectionsArray[i], yProjectionsArray[i],
                        xProjectionsArray[i+1]-xProjectionsArray[i],
                        yProjectionsArray[i+1]-yProjectionsArray[i]);
			    else
                    var res = rectEquivalent(rects, xProjectionsArray[i], yProjectionsArray[i],
                        xProjectionsArray[i+1]-xProjectionsArray[i],
                        yProjectionsArray[i+1]-yProjectionsArray[i]);
                res.numOfIntersections = numOfIntersections;
			    result.push(res);
            }
		}

        // в результирующем массиве пересекающиеся rects
        return result;
	};
    /**
     * функция нахождения глаз.
     * проссматриваем в объединении eyes&mouths
     * для первой проверки можно сделать, что все объекты mouth,
     * процентное величина которых характеризует их нахождения ниже
     * горизонтального центра рассматриваемого face
     *
     * @param eAndM - объединение областей eyes&mouths
     * @param face - рассматриваемая область `лицо`
     */
    var findEyesOnFaceArea  = function(eAndM, face){

    };
    /**
     * Здесь учитываем количество областей, которые имеют
     * пересечения, потому что они будут добавлены, практически,
     * с большой вероятностью.
     * @param rects
     */
    var findEyes = function(rects){};
    var intersectionSquare = function(point, i, xProjectionsArray, yProjectionsArray){
        var xLen, yLen;
        if(xProjectionsArray[point]>=xProjectionsArray[i]){
            if(xProjectionsArray[point+1]>=xProjectionsArray[i+1])
                xLen = xProjectionsArray[i+1] - xProjectionsArray[point];
            else
                xLen = xProjectionsArray[point+1] - xProjectionsArray[point];

        }
        else{
            if(xProjectionsArray[point+1]>=xProjectionsArray[i+1])
                xLen = xProjectionsArray[i+1] - xProjectionsArray[i];
            else
                xLen = xProjectionsArray[point+1] - xProjectionsArray[i];
        }
        if(yProjectionsArray[point]>=yProjectionsArray[i]){
            if(yProjectionsArray[point+1]>=yProjectionsArray[i+1])
                yLen = yProjectionsArray[i+1] - yProjectionsArray[point];
            else
                yLen = yProjectionsArray[point+1] - yProjectionsArray[point];

        }
        else{
            if(yProjectionsArray[point+1]>=yProjectionsArray[i+1])
                yLen = yProjectionsArray[i+1] - yProjectionsArray[i];
            else
                yLen = yProjectionsArray[point+1] - yProjectionsArray[i];
        }
        return xLen*yLen;
    };

    // процент пересекаемой области относительно общей площади объектов
    var percentOfIntersectionSq = function (sq,point, i, xProjectionsArray, yProjectionsArray){
        var sqA, sqB;
        sqA = (xProjectionsArray[point+1]-xProjectionsArray[point])*
            (yProjectionsArray[point+1]-yProjectionsArray[point]);
        sqB = (xProjectionsArray[i+1]-xProjectionsArray[i])*
            (yProjectionsArray[i+1]-yProjectionsArray[i]);
        return (sq/sqA)*100;
    }

	var uniqueAreaIndex = function(A){
		var n = A.length, k = 0, B = [];
		for(var i = 0; i < n; i++) {
		    if(!A[i])
		        continue;
            for (var j = i; j < n; j++) {
                if (!odd(A[i]) && A[i] + 1 == A[j])
                    delete A[j];
            }
        B.push(A[i]);
        }


		return B;
	};
	var onlyFirstValue = function(A){
        var n = A.length, k = 0, B = [];
        for(var i = 0; i<n; i++)
            if(odd(A[i]))
                A[i] = A[i]-1;
        return A;
    };

	var rectEquivalent = function(rects, x, y, w, h){
	    var result;
		rects.forEach(function cycle(rect){
            if(cycle.stop){ return; }
			if(rect.x == x && rect.y == y && rect.width == w && rect.height == h){
                result = rect;
                cycle = true;
            }
		});
		return result;
	};

    // проверка на нечетность
    var odd = function(number){return number%2;};
    var unique = function (A){
        var n = A.length, k = 0, B = [];
        for (var i = 0; i < n; i++)
        { var j = 0;
            while (j < k && B[j] !== A[i]) j++;
            if (j == k) B[k++] = A[i];
        }
        return B;
    };

    var findAreaAndDelete = function(rects, type){
        var result;
        rects.forEach(function cycle(rect, index){
            if(cycle.stop){return;}
            if(rect.typeOfArea == type){
                delete rects[index];
                result = rect;
                cycle.stop = true;
            }
        });
        return result;
    };
    var deleteAllRectsWithType = function(rects, type){

    };
    var updateRects = function(original, updated){
        original.forEach(function(origRect, index){
            var res = rectEquivalent(updated, origRect.x, origRect.y, origRect.width, origRect.height);
            if(res)
                original[index] = res;
        });
        return original;
    };

	detection.addRect = function(x, y, width, heigth){};

	detection.findPerson = function(){};



} (window));