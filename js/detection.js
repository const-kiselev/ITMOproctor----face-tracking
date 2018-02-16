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
            faces = updateRects(faces, areas);
            areas = deleteAllRectsWithType(areas, "face");
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
                eyes = updateRects(eyes, intersections);
                mouths = updateRects(mouths, intersections);
            }
            faceVerificationOnFaceArea(eyes.concat(mouths), currentFaceArea);

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
     * @param {int} MIN_INTERSECTION_SQ_PERCENT -- минимальное процентное
     *  соотношение площади пересекаемой области к площади области
     * @param {int} MAX_INTERSECTION_SQ_PERCENT
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
                // вычисляем общую площадь найденных элементов,
				// которые пересекаются с текущим (i) и проверяем с
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
					if(!searchArea)
                            // todo: костыль...
					        // вообще данный параметр должен присваиваться в любом случае, но может
					        // произойти проблема при вычислении методом треугольника
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
    var faceVerificationOnFaceArea  = function(eAndM, face){
        // метод треугольника
        function triangle(){
                // в первую очередь нам необходимо удалить все элементь
            var uniqueRects = deleteAllIntersectedAreas(eAndM);
                // вычисляем левую половину области лица и правую
            var leftPartOfFace = face;
            leftPartOfFace.width = face.width/2;
            var rightPartOfFace = leftPartOfFace;
            rightPartOfFace.x+=leftPartOfFace.width;
                // находим области, которые в левой и правой половине
            var areasOfLeftSide = findIntersections(uniqueRects, 60, 100, leftPartOfFace),
                areasOfRightSide = findIntersections(uniqueRects, 60, 100, rightPartOfFace);

            areasOfLeftSide.forEach(function cycleLeft(leftRect, leftIndex){
                if(cycleLeft.stop){return;}
                areasOfRightSide.forEach(function cycleRight(rightRect, rightIndex){
                    if(cycleRight.stop){return;}
                    if(widthDiff(leftRect, rightRect)>=50){
                        if(intersectionOy(leftRect, rightRect)){
                                // получается, что это два глаза!!! Мы их нашли
                                // todo: фиксируем их в любом случае!!!!!
                            cycleRight.stop = cycleLeft.stop = true;
                            var leftAreaIndex = equivalentRectIndex(eAndM, leftRect),
                                rightAreaIndex = equivalentRectIndex(eAndM, rightRect);
                            eAndM[leftAreaIndex].facePart = "leftEye";
                            eAndM[rightAreaIndex].facePart = "rightEye";
                            delete uniqueRects[leftAreaIndex];
                            delete uniqueRects[rightAreaIndex];
                        }
                    }
                });
            });
                // условие верификации лица выполнены
                // осталось найти mouth
                // todo: после тестов необходимо определить, мб buttomSide должен быть строго ниже detected eyes
            var buttomSide = face;
            buttomSide.height = face.height/2;
            buttomSide.y += buttomSide.height;
            var suspectedMouths = findIntersections(uniqueRects, 30, 60, buttomSide);
            if(suspectedMouths.length>1){}
            else if(suspectedMouths){}
        }
    };
    /**
     * todo: CURRENT WORK
     * Здесь учитываем количество областей, которые имеют
     * пересечения, потому что они будут добавлены, практически,
     * с большой вероятностью.
     * @param rects
     */
    var findEyes = function(rects, face){

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
	var equivalenRect = function(rects, find){
	    return rectEquivalent(rects, find.x, find.y, find.width, find.height);
    };
	var equivalentRectIndex = function(rects, find){
        var result;
        rects.forEach(function cycle(rect, index){
            if(cycle.stop){ return; }
            if(rect.x == x && rect.y == y && rect.width == w && rect.height == h){
                result = index;
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
        // возвращается эта найденная область
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
        // функция удаления областей, имеющих свойство intersectionWith
    var deleteAllIntersectedAreas = function (rects){
        rects.forEach(function(rect, index){
            if(rect.intersectionWith)
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
        // функция возвращает процент, на который различаются width областей
    var widthDiff = function(a,b){
        if(a<b){
            //  меняем местами
            var tmp = a;
            a = b;
            b = tmp;
        }

    };
        // процент пересечения одной области другой
    var intersectionOy = function(a,b){};
	detection.addRect = function(x, y, width, heigth){};
	detection.findPerson = function(){};
} (window));