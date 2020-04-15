var GLOBAL_PADDING=200;
var config = {
    type: Phaser.AUTO,
    parent: 'game',
    autoCenter: true,
    width: (screen.width - GLOBAL_PADDING),
    height: (screen.height - 400),
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 250 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    bombing_runs: [],
    bombs: 0,
    bombing: false
};
// ------------------------------------------------------------
// globals
// ------------------------------------------------------------
var player;
var platforms;
var cursors;
var bombs;
var bomb;
var boom;
var COLLIDER;
var game = new Phaser.Game(config);
var soundHurt;
var music;
var bg_music;
var controls, arrow_left, arrow_right;
var tics = 0;
var mp;
const dimensions = {
    platform: {
        width: 400,
        height: 32,
        scaleFactor: config.width/400
    }
}

// ------------------------------------------------------------
// PRELOAD
// ------------------------------------------------------------
function preload () {
    // Do this if on ben-willenbring.com
    // this.load.setBaseURL('http://labs.phaser.io');
    // Static images
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');

    // Animated Sprites
    this.load.spritesheet('dude', 'assets/ninja.png', { frameWidth: 64, frameHeight: 96 });
    this.load.spritesheet('boom', 'assets/sprites/bomb-twirling.png', { frameWidth: 64, frameHeight: 64, endFrame: 28 });

    // Sounds
    this.load.audio('hurt', 'assets/sounds/hurt.mp3');
    this.load.audio('music', 'assets/sounds/explosion.mp3');
    this.load.audio('bg_music', 'assets/sounds/surf-music.mp3');

    // Controls
    this.load.image('arrow', 'assets/arrow_blue.png');
}


// ------------------------------------------------------------
// create
// ------------------------------------------------------------
function create () {
    // ------------------------------------------------------------
    // Cursors
    // ------------------------------------------------------------
    cursors = this.input.keyboard.createCursorKeys();

    // ------------------------------------------------------------
    // Background
    // ------------------------------------------------------------
    this.add.image(600, 450, 'sky').setScale(2);

    // ------------------------------------------------------------
    // Platforms
    // ------------------------------------------------------------
    platforms = this.physics.add.staticGroup();
    // Ground platform at 0, all the way at the bottom
    platforms
        .create(0,0, 'ground')
        .setOrigin(0,0)
        .setDisplaySize(config.width, 20)
        .setPosition(0, config.height - 10)
        .refreshBody();

    platforms
        .create(0,0, 'ground')
        .setOrigin(0,0)
        .setDisplaySize(400, 20)
        .setPosition(config.width - 400, config.height - 300)
        .refreshBody();

    // Upper left
    platforms
        .create(0,0, 'ground')
        .setOrigin(0,0)
        .setDisplaySize(200, 20)
        .setPosition(0, 200)
        .refreshBody();


    // ------------------------------------------------------------
    // Player
    // ------------------------------------------------------------
    player = this.physics.add.sprite(100, 450, 'dude').setScale(1.5);
    player.setBounce(.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'goLeft',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 2,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 6
    });
    this.anims.create({
        key: 'goRight',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 2,
        repeat: -1
    });

    // ------------------------------------------------------------
    // Bomb anims
    // ------------------------------------------------------------
    this.anims.create({
        key: 'fall',
        frames: this.anims.generateFrameNumbers('boom', { start: 25, end: 28}),
        repeat: -1,
        frameRate: 20
    });
    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('boom', { start: 0, end: 23}),
        frameRate: 30
    });

    // ------------------------------------------------------------
    // Allow player and platforms to collide into eachother
    // ------------------------------------------------------------
    this.physics.add.collider(player, platforms);
    // ------------------------------------------------------------
    // Explosion
    // ------------------------------------------------------------
    this.input.keyboard.on('keyup_B', function(event) {
        console.log('Toggling the bombing run!!!');
        toggleBombing();
    }, this);

    // this.input.keyboard.on('keyup_UP', function(event) {
    //     // movePlayer('up');
    //     dropPlayer();
    // });
    this.input.keyboard.on('keydown_UP', function(event) {
        dropPlayer();
    });


    // ------------------------------------------------------------
    // Bomb Collisions
    // ------------------------------------------------------------
    bombs = this.physics.add.group();
    // Ensure that the right thing happens when the player and the falling bomb collide
    // this.physics.overlap(player, boom, hurtPlayer, null, this);
    this.physics.add.collider(player, bombs, hurtPlayer, null, this);

    // Sounds
    soundHurt = this.sound.add('hurt');
    music = this.sound.add('music', { loop: false });
    bg_music = this.sound.add('bg_music', { loop: true });

}

function update () {
    // Get a ref to the pointer
    // mp = game.input.mousePointer;
    mp = game.input.activePointer;
    let swiping_right = mp.isDown && mp.x > player.x && mp.downElement.tagName == 'CANVAS';
    let swiping_left = mp.isDown && mp.x < player.x && mp.downElement.tagName == 'CANVAS';
    let swiping_up = mp.isDown && mp.y < player.y && mp.downElement.tagName == 'CANVAS';


    // Test for conditions
    if (cursors.up.isDown || swiping_up) {                       // Player is jumping
        movePlayer('up');
    }
    else if (cursors.left.isDown || swiping_left) {          // Player moving left
        movePlayer('left');
    }
    else if (cursors.right.isDown || swiping_right) {   // Player moving right
        movePlayer('right');
    }
    else {
        movePlayer('turn');
    }

}

function hurtPlayer(player, boom) {
    incrementScoreBy(-1);
    let x = boom.x;
    let y = boom.y;
    boom.destroy();

    var expl = this.physics.add.sprite(x, y, 'boom').anims.play('explode');
    expl.anims.play('explode');
    soundHurt.play({volume:5});

    // Play the explosion after a short delay
    const fn = () => {
        music.play({volume:.5});
    }
    setTimeout(fn, 250);
}

function generate_bomb({
    min_x = player.x - 50,
    max_x = player.x + player.width + 50,
    min_y = (player.y - 150),
    max_y = player.y - 350,
    bomb_angle = range(-30, 30),
    bomb_velocityX = range(10, 50),
    bomb_velocityY = range(10, 200)
} = {}) {

    const bomb_x = range(min_x, max_x);
    const bomb_y = range(min_y, max_y);
    var bomb = bombs.create(bomb_x, bomb_y, 'boom');
    bomb.anims.play('fall', true);
    bomb.setAngle(bomb_angle);
    bomb.setVelocityX(bomb_velocityX);
    bomb.setVelocityY(bomb_velocityY);
    bomb.setAngularAcceleration(range(10, 30));
    // var bomb = bombs.create(player.x, player.y - 175, 'boom');
    config.bombs++;
    console.log(bomb);
}

function movePlayer(direction='right') {
    if (direction !== 'turn') {
        console.log('moving player ' + direction);
        console.log(mp);
        var o = {
            mp_downX: mp.downX,
            mp_x: mp.x,
            mp_downY: mp.downY,
            mp_y: mp.y,
            player_x: player.x,
            player_y: player.y,
        }
        document.getElementById('debugger').innerHTML = '' +
            `<b>Dir: ${direction}</b><br/>` +
            JSON.stringify(o, undefined, 2);
    }
    if (direction !== 'up') {
        // player.setVelocityY(0);
    }
    switch(direction) {
        case 'left':
        case 'Left':
            player.setVelocityX(-260);
            player.anims.play('goLeft', true);
            break;

        case 'right':
        case 'Right':
            player.setVelocityX(260);
            player.anims.play('goRight', true);
            break;

        case 'up':
            dropPlayer();
            break;

        default:
            player.setVelocityX(0);
            player.anims.play('turn');
            break;

    }

}

function dropPlayer() {
    player.body.gravity.y = 1000;
    player.setVelocityY(-700);
}

function range(min, max) {
    return Math.random() * (max - min) + min;
}


$(document).ready(function() {
    let controls = $('#controls');
    controls.css({ width: (config.width - 20) });

    $('button[value="left"]').bind('click', function() {

        let timerId = setInterval(() => movePlayer('left'), 250);

        // after 3 seconds stop
        setTimeout(() => { clearInterval(timerId); alert('stop'); }, 3000);
    });
    // This means 2 pointers are actually being used
    let w = screen.width - (GLOBAL_PADDING/2);
    $('canvas').width(w);
    $('#controls').width(w-24);
    console.log('uplifing message here!!!');
    setTimeout(beginBombing, 500);
});

function incrementScoreBy(num) {
    let score_card = $('#score');
    let current_score = Math.floor(score_card.attr('value'));
    let new_value = current_score + num;
    score_card.attr('value', new_value)
    score_card.text(new_value);
}

function toggleBombing() {
    if (config.bombing) {
        config.bombing = false;
        // Clear out all intervals...
        for (i=0; i< config.bombing_runs.length; i++) {
            let id = config.bombing_runs[i];
            clearInterval(id);
        }
        // Clear out all runs
        config.bombing_runs = [];
        // Set the button text
        $('#btnPlay').text('Resume');
        bg_music.pause();
    }
    else {
        beginBombing();
    }
}

function beginBombing() {
    if (!config.bombing) {
        const fn = () => {
            for (let i=0; i< 3; i++) {
                setTimeout(generate_bomb, range(50, 1250));
            }
        }

        if (config.bombing_runs.length < 3) {
            let id = setInterval(fn, 4000);
            config.bombing_runs.push(id);
            config.bombing = true;
            console.log(`ADDING BOMBING RUN WITH ID=${id}` );
            $('#btnPlay').text('Pause');
            bg_music.play({volume:4});
        }
    }
}

// For shooting, possibly this...
if (game.input.pointers[0].worldX && game.input.pointers[0].worldX ) {

}
