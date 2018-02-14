(function(window, undefined){
	window.detection = window.detection || {};

	    // минимальный процент пересечения двух rects
	var SQUARES_INTERSECTION_MIN_PERCENT = 50;

	    // Конструктор todo: реализовать далее!!!!
	detection.Person = function(){
		var lifeTime= 0, // ms
			eyes = [],
			faces = [],
			mouths = [];
	};
        // array of detected persons
	detection.persons = [];
	    // массив с подозрительными элементами
	detection.suspectObjs = [];
    /**
     * PUBLIC function
     * публичный метод, который выполняет поиск лиц на кадре (frame)
     * @param rects
     */
	detection.findFace = function(rects) {
	        // разбиваем распознанные элементы согласно типам (typeOfArea)
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
         * todo: удаляем области, которые ему пренадлежат и опять
         * запускаем faceViaFaces
         */
        function faceViaFaces(){
                // faces, eyes & mouths из [[scope]]
            var currentFaceArea = findAreaAndDelete(faces, "face");
                // находим все элементы внутри области face
            var areas = findIntersections(eyes.concat(mouths), 60, 100, currentFaceArea);
            updateRects(faces, areas);
            deleteAllRectsWithType(areas, "face");
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
     * Метод сравнения: вычисление принадлежности новых
     * областей (скорей всего элементов suspectObjs и неопознанных областей)
     * относительно существующих областей в persons
     * @param rects
     */
    var comparison = function(rects) {};

    /**
     * метод нахождения пересечений.
     * @param {Array} rects -- массив областей
     * @param MIN_INTERSECTION_SQ_PERCENT -- минимальное процентное
     *  соотношение площади пересекаемой области к площади области
     * @param MAX_INTERSECTION_SQ_PERCENT
     * @param {object} searchArea -- определенная область, с которой
     *  необходимо найти пересекающиеся области из rects
     * @returns {Array}
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
            // array|x0|x1|x2|y3|...|xN-2|xN-1| четные ЧИСЛА характеризуют (аналогично для координат по Oy)
            // меньшую координату границы прямоугольника (ОБЛАСТИ, rect) на оси
            // на данной особенности завязаны все манипуляции. Поэтому удобно передавать
            // или работать именно с координатой с нечетным индексом (i), это означает,
            // что мы обращаемся к области с индексом i/2 in rects
            // для замены координат с четным индексом есть функция onlyFirstValue() (см. ниже)
            // так же после (или до, в зависимости от задачи) этого желательно
            // проверить на повторяющиеся индексы. для удаления исп. функцию uniqueAreaIndex() (см. ниже)
		rects.forEach(function(rect){
			xProjectionsArray[i] = rect.x;
			yProjectionsArray[i++] = rect.y;
			xProjectionsArray[i] = rect.x + rect.width;
			yProjectionsArray[i++] = rect.y + rect.height;
		});
        var n = xProjectionsArray.length;
        if(searchArea)
            {n = 1;}
            // в данном цикле переменная i характеризует область,
            // относительной которой проверяются отсальные
            // области на факт существования общей площади (пересечения)
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
     * с большОй вероятностью.
     * @param rects
     */
    var findEyes = function(rects){
            // метод треугольника
        function triangle(){

        }
    };
    /**
     * площадь пересечения двух областей
     * @param point
     * @param i
     * @param xProjectionsArray
     * @param yProjectionsArray
     * @returns {number}
     */
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
    /**
     * процент нахождения части (пересечения) одной области в другой
     * формула вычисления: S(ПЕРЕСЕЧЕНИЕ(A,B))/S(A)*100
     * где S() — площадь, A - область, которая пересекает область B.
     * то есть, если S(A)=ПЕРЕСЕЧЕНИЕ(A,B), то percentOfIntersectionSq() вернет 100
     * @param sq
     * @param point
     * @param i
     * @param xProjectionsArray
     * @param yProjectionsArray
     * @returns {number}
     */
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
        // возвращает rect с аналогичными параметарми. Нужен для того,
        // чтобы не потерять другие свойства объектов-областей.
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
        // удаление повторяющихся элементов
    var unique = function (A){
        var n = A.length, k = 0, B = [];
        for (var i = 0; i < n; i++)
        { var j = 0;
            while (j < k && B[j] !== A[i]) j++;
            if (j == k) B[k++] = A[i];
        }
        return B;
    };
        // поиск и удаление областей с заданным типом
        // !!! удаляется только первый найденный элемент
        // !!! для удаления всех таких областей есть deleteAllRectsWithType()
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
        // поиск и удаление ВСЕХ областей с заданным типом
    var deleteAllRectsWithType = function(rects, type){
        rects.forEach(function(rect, index){
            if(rect.typeOfArea == type)
                delete rects[index];
        });
        return rects;
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