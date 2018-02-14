# ITMOproctor----face-tracking

Ссылка на тестирование: https://host-2:8890/trackingjs/examples/face_camera.html

https://yadi.sk/d/ciU3Ygos3SDTkx
https://yadi.sk/i/MB6Wtfqk3SDVtX
https://yadi.sk/i/LEIjN20a3SDY3U


Тестирование алгоритма:
1. добавление console.log // tracking.js:1008 (данные относительно определяемой области на изображении 5)
2. 


СРЗНАЧ	0,338601722	СРЗНАЧ	0,338694044
СРОТКЛ	0,090725665	СРОТКЛ	0,090760192
МАКС	0,983008627	МАКС	0,983008627
МИН	0,200001738	МИН	0,2
face tag friends		face tag friends	
face		face, eye, mouth	
все значения blockEdgesDensity // tracking.js:1008		все значения blockEdgesDensity // tracking.js:1008	

Определение типа распозн. объекта: 
tracking.ViolaJones.classifiers.eye[3] = 6
tracking.ViolaJones.classifiers.mouth[3] = 13
tracking.ViolaJones.classifiers.face[3] = 3


Логика системы: 
....
метод ObjectTracker.proto...track(...) : выполняет вызов необходимой матем функции, которая определяет области, для отображения. 
возвращаемый тип: область(rect) который после всех найденных облестей в части изображения, объединяет вычисления (....).

// 2579
