'use strict'
// Initalize renderer
var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize( window.innerWidth * 0.8, window.innerHeight * 0.8);

if (window.innerWidth > 800) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.needsUpdate = true;
}

document.getElementById("visualizer").appendChild( renderer.domElement );

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth * 0.8, window.innerHeight * 0.8);
}

// Set camera

var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
camera.position.set(0, 10, 14);


var scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);
scene.fog = new THREE.FogExp2(0xFFFFFF, 0.02);

var city = new THREE.Object3D();
var smoke = new THREE.Object3D();
var town = new THREE.Object3D();

var createCarPos = true;
var uSpeed = 0.001;


//----------------------------------------------------------------- MOUSE function
var mouse = new THREE.Vector2();

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
function onDocumentTouchStart( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        mouse.x = event.touches[ 0 ].pageX -  window.innerWidth / 2;
        mouse.y = event.touches[ 0 ].pageY - window.innerHeight / 2;
    }
}
function onDocumentTouchMove( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        mouse.x = event.touches[ 0 ].pageX -  window.innerWidth / 2;
        mouse.y = event.touches[ 0 ].pageY - window.innerHeight / 2;
    }
}
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('touchstart', onDocumentTouchStart, false );
window.addEventListener('touchmove', onDocumentTouchMove, false );


//----------------------------------------------------------------- RANDOM Function
function mathRandom(num = 8) {
    var numValue = - Math.random() * num + Math.random() * num;
    return numValue;
}

//----------------------------------------------------------------- CREATE City
var cube_list = new Array();
function init() {
    let segments = 2;
    for (let i = 0; i < 128; i++) {
        let geometry = new THREE.CubeGeometry(0.5, 1, 0.5, segments, segments, segments);
        let r = 255 - i, g = 10, b = 2 * i;
        let material = new THREE.MeshStandardMaterial({
            color: r*256*256+g*256+b,
            wireframe: false,
            roughness: 0.3,
            metalness: 0.91,
            shading: THREE.SmoothShading,
            side: THREE.DoubleSide});
        let wmaterial = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF,
            wireframe: true,
            transparent: true,
            opacity: 0.03,
            side: THREE.DoubleSide});

        let cube = new THREE.Mesh(geometry, material);
        let floor = new THREE.Mesh(geometry, material);
        let wfloor = new THREE.Mesh(geometry, wmaterial);

        cube.add(wfloor);
        cube.castShadow = true;
        cube.receiveShadow = true;
        cube.rotationValue = 0.1 + Math.abs(mathRandom(8));

        floor.scale.x = floor.scale.z = 1 + mathRandom(0.33);
        floor.scale.y = 0.05 + Math.abs(mathRandom(0.05));

        let cubeWidth = 0.9;
        cube.scale.x = cube.scale.z = cubeWidth + mathRandom(1 - cubeWidth);
        cube.scale.y = 2 + Math.abs(mathRandom(0.5));
        cube.position.x = - 16 + 2 * (i%16) + (i/16);//Math.round(mathRandom());
        cube.position.z = - 8 + 2 * (i/16);//Math.round(mathRandom());

        floor.position.set(cube.position.x, 0, cube.position.z);

        town.add(floor);
        town.add(cube);
        cube_list.push(cube);
    }
    //----------------------------------------------------------------- Particular
    let gmaterial = new THREE.MeshToonMaterial({color:0xFFFFFF, side:THREE.DoubleSide});
    let gparticular = new THREE.CircleGeometry(0.01, 3);
    let aparticular = 16;

    for (let h = 1; h < 3000; h++) {
        let particular = new THREE.Mesh(gparticular, gmaterial);
        particular.position.set(mathRandom(aparticular), mathRandom(aparticular),mathRandom(aparticular));
        particular.rotation.set(mathRandom(), mathRandom(), mathRandom());
        smoke.add(particular);
    }

    let pmaterial = new THREE.MeshPhongMaterial({
        color: 0x101010,
        side: THREE.DoubleSide,
        roughness: 10,
        metalness: 0.6,
        opacity: 0.9,
        transparent: true});
    let pgeometry = new THREE.PlaneGeometry(60, 60);
    let pelement = new THREE.Mesh(pgeometry, pmaterial);
    pelement.rotation.x = -90 * Math.PI / 180;
    pelement.position.y = -0.001;
    pelement.receiveShadow = true;

    city.add(pelement);


}

//----------------------------------------------------------------- Lights
var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
var lightFront = new THREE.SpotLight(0xFFC0CB, 5, 3);
var lightBack = new THREE.PointLight(0xF0E68C, 5, 0);

lightFront.rotation.x = 45 * Math.PI / 180;
lightFront.rotation.z = -45 * Math.PI / 180;
lightFront.position.set(0, 3, 0);
lightFront.castShadow = true;
lightFront.shadow.mapSize.width = 6000;
lightFront.shadow.mapSize.height = 6000;
lightFront.penumbra = 0.1;
lightBack.position.set(0,4,0);

smoke.position.y = 2;

scene.add(ambientLight);
city.add(lightFront);
scene.add(lightBack);
scene.add(city);
city.add(smoke);
city.add(town);

//----------------------------------------------------------------- GRID Helper
var gridHelper = new THREE.GridHelper( 60, 60, 0xFF0000, 0x000000);
city.add( gridHelper );

//----------------------------------------------------------------- LINES world

var createCars = function(cScale = 2, cPos = 20, cColor = 0xFFFF00) {
    var cMat = new THREE.MeshToonMaterial({color:cColor, side:THREE.DoubleSide});
    var cGeo = new THREE.CubeGeometry(1, cScale/40, cScale/40);
    var cElem = new THREE.Mesh(cGeo, cMat);
    var cAmp = 8;

    if (createCarPos) {
        createCarPos = false;
        cElem.position.x = -cPos;
        cElem.position.z = (mathRandom(cAmp));

        TweenMax.to(cElem.position, 3, {x:cPos, repeat:-1, yoyo:true, delay:mathRandom(3)});
    } else {
        createCarPos = true;
        cElem.position.x = (mathRandom(cAmp));
        cElem.position.z = -cPos;
        cElem.rotation.y = 90 * Math.PI / 180;

        TweenMax.to(cElem.position, 5, {z:cPos, repeat:-1, yoyo:true, delay:mathRandom(3), ease:Power1.easeInOut});
    }
    cElem.receiveShadow = true;
    cElem.castShadow = true;
    cElem.position.y = Math.abs(mathRandom(5));
    city.add(cElem);
};

var generateLines = function() {
    for (let i = 0; i < 60; i++) {
        createCars(0.1, 20);
    }
};


window.onload = function() {

    let file = document.getElementById("thefile");
    let audio = document.getElementById("audio");

    file.onchange = function() {
        let files = this.files;
        audio.src = URL.createObjectURL(files[0]);
        audio.load();
        audio.play();
        let context = new AudioContext();
        let src = context.createMediaElementSource(audio);
        let analyser = context.createAnalyser();

        src.connect(analyser);
        analyser.connect(context.destination);

        analyser.fftSize = 256;

        let bufferLength = analyser.frequencyBinCount;
        console.log(bufferLength);

        let dataArray = new Uint8Array(bufferLength);

        function renderFrame() {
            requestAnimationFrame(renderFrame);

            analyser.getByteFrequencyData(dataArray);

            for (let i = 0; i < bufferLength; i++) {
                cube_list[i].scale.y = 0.1 + dataArray[i] / 256 * 8;
            }

            let angle = Math.PI - Math.PI * (audio.currentTime/audio.duration);
            lightFront.position.set(0, 4 * Math.sin(angle), 4 * Math.cos(angle));
            lightBack.position.set(4 * Math.cos(angle),4 * Math.sin(angle), 0);

            city.rotation.y -= ((mouse.x * 8) - camera.rotation.y) * uSpeed;
            city.rotation.x -= (-(mouse.y * 2) - camera.rotation.x) * uSpeed;
            if (city.rotation.x < -0.05) city.rotation.x = -0.05;
            else if (city.rotation.x > 1) city.rotation.x = 1;

            smoke.rotation.y += 0.01;
            smoke.rotation.x += 0.01;

            camera.lookAt(city.position);
            renderer.render( scene, camera );
        }

        audio.play();
        init();
        renderFrame();
    };
    generateLines();
    init();
    camera.lookAt(city.position);
    renderer.render( scene, camera );
};