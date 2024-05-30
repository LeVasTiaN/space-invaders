const gameContainer = document.querySelector('.game-container');
const player = document.querySelector('.player');
const scoreContainer = document.querySelector('.score-count');
const livesContainer = document.querySelector('.lives-count');
const aliens = []; //array that stores all alien elements
const bullets = []; //array that stores all existing bullets
const initAlienPos = []; //array that stores each aliens` position

let level = 1; //how many times a group of aliens was defeated. Used for the speed of the aliens
let livesCount = 3; //number of lives of the player
let alienDirection = 1; //defines later on whether the aliens move to the right or left
let score = 0; //score for killing aliens
let moveLeft = false; // flag for moving left (for player)
let moveRight = false; // flag for moving right (for player)
let shootingInterval; // interval used for continuous movement of a bullet
let canShoot = true; // flag for the cool down of the bullet
let isShooting = false; // flag for whether the space bar is currently being held
let gameOver = false; //flag for when the lives are exhausted and the game ends
let noAliens = false; //flag for when all aliens are defeated

function movePlayer() { //function for moving the player
    let x;
    if (moveLeft && player.offsetLeft > 0) {
        x = player.offsetLeft - 5;
    }
    else if (moveRight && player.offsetLeft + player.offsetWidth < gameContainer.clientWidth) {
        x = player.offsetLeft + 5;
    }
    player.style.left = `${x}px`;

}
function createAliens() { //function for creating a batch of aliens
    if (noAliens) {
        alienDirection = 1;
        for (let i = 1; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                const alien = document.createElement('div');
                alien.classList.add('alien');
                alien.style.top = `${i * 40}px`;
                alien.style.left = `${j * 60}px`;
                gameContainer.appendChild(alien);
                aliens.push(alien);
                initAlienPos.push({top: alien.style.top, left: alien.style.left});
            }
        }
        level++;
        noAliens = false;
    }
}
function moveAliens() { //function for moving each alien around the map
    aliens.forEach(alien => {
        alien.style.left = `${alien.offsetLeft + alienDirection * level}px`;
    });

    const leftMostAlien = Math.min(...aliens.map(alien => alien.offsetLeft)); //calculates the leftmost alien
    const rightMostAlien = Math.max(...aliens.map(alien => alien.offsetLeft)); //calculates the rightmost alien

    if (leftMostAlien <= 0 || rightMostAlien >= gameContainer.offsetWidth - 40) { //if the alien on the edge interacts with the border
        alienDirection *= -1; //changes direction of the aliens' movement
        aliens.forEach(alien => {
            alien.style.top = `${alien.offsetTop + 40}px`; //pushes the aliens one row down
        });
    }
    playerHit(); //always checks if an alien has hit the player
}
function createLivesCount() {
    for (let i = 1; i <= livesCount; i++) {
        const heart = document.createElement('img');
        heart.classList.add('heart');
        heart.id = `heart${i}`
        heart.src = 'assets/heart_full.png';
        livesContainer.appendChild(heart);
    }
}
function isCollision(obj1, obj2) { //function for checking if two object have collided
    const obj1Rect = obj1.getBoundingClientRect();
    const obj2Rect = obj2.getBoundingClientRect();

    return !(
        obj1Rect.top > obj2Rect.bottom ||
        obj1Rect.bottom < obj2Rect.top ||
        obj1Rect.left > obj2Rect.right ||
        obj1Rect.right < obj2Rect.left
    );
}
function playerHit() {
    aliens.forEach(alien => {
        if (isCollision(alien, player) && livesCount) reduceHP();
        else if (livesCount === 0) endGame();
    });
}
function reduceHP() {
    const heart = document.querySelector(`#heart${livesCount}`);
    heart.src = "assets/heart_empty.png";
    livesCount--;
    alienDirection = 1;
    aliens.forEach((alien, index) => { //return the remaining aliens to their original position
        alien.style.top = initAlienPos[index].top;
        alien.style.left = initAlienPos[index].left;
    });
}
function endGame() {
    if (!gameOver) {
        player.remove();
        aliens.forEach(alien => {alien.remove()});
        bullets.forEach(bullet => {bullet.remove()});
        const gameOverScreen = document.createElement('div');
        gameOverScreen.classList.add('game-over-screen');
        gameOverScreen.textContent = 'GAME OVER';
        gameContainer.appendChild(gameOverScreen);
        gameOver = true;
    }
}
function shootBullet() { //generates two bullets with positions relative to the player
    if (!canShoot || livesCount === 0) return;
    const bullet = document.createElement('div');
    const bullet2 = document.createElement('div');
    bullet.classList.add('bullet');
    bullet2.classList.add('bullet');
    bullet.style.left = `${player.offsetLeft + player.offsetWidth / 2 - 24}px`;
    bullet2.style.left = `${player.offsetLeft + player.offsetWidth / 2 + 20}px`;
    bullet.style.bottom = `67px`;
    bullet2.style.bottom = `67px`;
    gameContainer.appendChild(bullet);
    gameContainer.appendChild(bullet2);
    bullets.push(bullet);
    bullets.push(bullet2);
    canShoot = false;
    setTimeout(() => canShoot = true, 400);
}
function startShooting() { //function for while the space button is held
    if (!isShooting) {
        isShooting = true;
        shootBullet();
        shootingInterval = setInterval(shootBullet);
    }
}
function moveBullets() { // function for moving the bullets upwards
    bullets.forEach((bullet, index) => {
        let bulletPosition = parseInt(bullet.style.bottom);
        bullet.style.bottom = `${bulletPosition + 5}px`;

        if (bulletPosition > gameContainer.offsetHeight) { //if a bullet reaches the top of the screen
            bullet.remove();
            bullets.splice(index, 1);
        }

        aliens.forEach((alien, alienIndex) => { //monitors whether any of the aliens have been shot
            if (isCollision(bullet, alien)) {
                bullet.remove();
                explosion(alien);
                bullets.splice(index, 1);
                aliens.splice(alienIndex, 1);
                initAlienPos.splice(alienIndex, 1)
                score += 50;
                scoreContainer.innerHTML = `Score:${score}`;
            }
        });
    });
    checkAllAliensDefeated();
}
function explosion(alien) { //function for when an alien has been shot, create explosion
    const explosion = document.createElement('img');
    explosion.src = 'assets/explosion.gif';
    explosion.style.position = 'absolute';
    explosion.style.left = alien.style.left;
    explosion.style.top = alien.style.top;
    explosion.style.width = '40px';
    explosion.style.height = '40px';
    gameContainer.appendChild(explosion);
    setTimeout(() => {explosion.remove();}, 500);
    alien.remove();
}
function checkAllAliensDefeated() { //check if all aliens were defeated
    if (aliens.length === 0) {
        noAliens = true;
        setTimeout(createAliens, 1000);
    }
}
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') startShooting();
    if (e.key === 'a') moveLeft = true;
    if (e.key === 'd') moveRight = true;
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'a') moveLeft = false;
    if (e.key === 'd') moveRight = false;
    if (e.key === ' ') {
        isShooting = false;
        clearInterval(shootingInterval);
    }
});
function gameLoop() {
    movePlayer();
    moveBullets();
    moveAliens();
    requestAnimationFrame(gameLoop); //loops the function to create animation
}
createLivesCount();
createAliens();
gameLoop();
