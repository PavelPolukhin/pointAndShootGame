/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;
ctx.font = '50px Roboto'

let timeToNextRaven = 0;
let ravenInterval = 1000;
let gameOver = false;
let lastTime = 0;
let score = 0;
const randomColors = () => {
    return Math.floor(Math.random() * 255);
}
const randomColor = (colorsArray) => {
    return 'rgb(' + colorsArray[0] + ',' + colorsArray[1] + ',' + colorsArray[2] + ')'
}

let ravens = [];
class Raven {
    constructor() {
        this.spriteWidth = 271;
        this.spriteHeight = 194;
        this.sizeModifier =  Math.random() * 0.6 + 0.4;
        this.width = this.spriteWidth * this.sizeModifier;
        this.height = this.spriteHeight * this.sizeModifier;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.directionX =  Math.random() + 0.03;
        this.directionY =  Math.random() - 0.3;
        this.markedForDeletion = false;
        this.image = new Image();
        this.image.src = 'images/raven.png';
        this.frame = 0;
        this.maxFrame = 4;
        this.timeSinceFlap = 0;
        this.flapInterval = Math.random() * 50 + 50;
        this.randomColors = [randomColors(), randomColors(), randomColors()];
        this.color = randomColor(this.randomColors)
    }
    update(deltaTime) {
        if (this.y < 0 || this.y > canvas.height - this.height){
            this.directionY *= -1;
        }
        this.x -= this.directionX;
        this.y += this.directionY;
        if(this.x < 0 - this.width) this.markedForDeletion = true;
        this.timeSinceFlap += deltaTime;
        if(this.timeSinceFlap > this.flapInterval) {
            if ( this.frame > this.maxFrame) this.frame = 0;
            else this.frame++;
            this.timeSinceFlap = 0;
        }
        if (this.x < 0 - this.width) gameOver = true;
    }
    draw() {
        collisionCtx.fillStyle = this.color;
        collisionCtx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height)
    }
}

let explosions = [];

class Explosion {
    constructor(x, y, size) {
        this.image = new Image();
        this.image.src = 'images/boom.png';
        this.spriteWidth = 200;
        this.spriteHeight = 179;
        this.size = size;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.sound = new Audio();
        this.sound.src = 'sounds/boom.wav';
        this.timeSinceLastFrame = 0;
        this.frameInterval = 200;
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        if (this.frame === 0) this.sound.play();
        this.timeSinceLastFrame += deltaTime;
        if (this.timeSinceLastFrame > this.frameInterval) {
            this.frame++;
            this.timeSinceLastFrame = 0;
            if (this.frame > 5) this.markedForDeletion = true;
        }
    }

    draw() {
        ctx.drawImage(this.image,
            this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
            this.x, this.y - this.size / 4, this.size, this.size);
    }
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.fillText('Счет: ' + score, 50, 75);
    ctx.fillStyle = 'white';
    ctx.fillText('Счет: ' + score, 50, 80);
}

function drawGameOver() {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText('Игра закончена, ваш счет: ' + score, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = 'white';
    ctx.fillText('Игра закончена, ваш счет: ' + score, canvas.width / 2, canvas.height / 2 + 5);
}

diffArrays = (arr1, arr2) => {
    return JSON.stringify(arr1) === JSON.stringify(arr2)
}

window.addEventListener('click', (e) => {
    const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
    const pixelColor = [...detectPixelColor.data].splice(0, 3);
    ravens.forEach(object => {
        if(diffArrays(object.randomColors, pixelColor)) {
            object.markedForDeletion = true;
            score++;
            const pushBoomItem = new Explosion(object.x, object.y, object.width);
            explosions.push(pushBoomItem);
        }
    })
})

function animate(timestamp) {
    if (score > 20) ravenInterval = 500;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextRaven += deltaTime;
    if (timeToNextRaven > ravenInterval) {
        const pushItem = new Raven();
        ravens.push(pushItem);
        timeToNextRaven = 0;
        ravens.sort(function (a ,b) {
            return a.width - b.width;
        })
    }
    drawScore();
    [...ravens, ...explosions].forEach(object => object.update(deltaTime));
    [...ravens, ...explosions].forEach(object => object.draw());
    ravens = ravens.filter(object => !object.markedForDeletion);
    explosions = explosions.filter(object => !object.markedForDeletion);
    if (!gameOver) requestAnimationFrame(animate);
    else drawGameOver();
}
animate(0);
