var GLOBAL_PADDING=200;
function getDimensions() {
    let obj = {
        userAgent: navigator.userAgent,
        width: screen.width - 200,
        height: $(window).height() - 10,
        availWidth: screen.availWidth,
        availheight: screen.availHeight,
        screen_orientation_angle: screen.orientation.angle ? screen.orientation.angle : null,
        screen_orientation_type: screen.orientation.type ? screen.orientation.type : null
    }
    if ($.isNumeric(obj.screen_orientation_angle) || obj.screen_orientation_type.includes('portrait')) {
        // tablet or phone
        obj.height -= GLOBAL_PADDING;
    }
    /** ipad landscape
    {
      "userAgent": "Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1",
      "width": 1366,
      "height": 1024,
      "availWidth": 1366,
      "availheight": 1024,
      "screen_orientation_angle": 90,
      "screen_orientation_type": "landscape-primary"
    }
    */
    return obj;
}

const dims = getDimensions();
var config;

// ------------------------------------------------------------
// globals
// ------------------------------------------------------------
var player;
var soundBoard = {};
var ninja_sounds = {
    you_will_pay: 'assets/sounds/ninja/you-will-pay-with-your-life.mp3',
    you_underestimate_me: 'assets/sounds/ninja/you-underestimate-me.mp3',
    you_serve_no_purpose: 'assets/sounds/ninja/you-serve-no-purpose.mp3',
    you_dont_know: 'assets/sounds/ninja/you-dont-know-what-youve-become.mp3'
}

function getRandomNinjaSound() {
    let arr = Object.keys(ninja_sounds);
    let i = Phaser.Math.Between(0, arr.length-1);
    let s = arr[i];
    console.log('The random phrase is...' + s);
    return s;
}
var fx_sounds = {
    shoot1: 'assets/sounds/fx/shoot1.m4a'
}
var stars;
var platforms;
var cursors;
var bombs;
var bomb;
var boom;
var game;
var soundHurt;
var music;
var bg_music;
var controls, arrow_left, arrow_right;
var tics = 0;
var mp;


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
    // Star
    this.load.atlas('star', 'assets/sprites/twirling-star.png', 'assets/sprites/twirling-star.json');
    // this.load.animation('star', 'assets/sprites/star/Animation.json');

    // addAtlasJSONHash

    // Sounds
    this.load.audio('hurt', 'assets/sounds/hurt.mp3');
    this.load.audio('music', 'assets/sounds/explosion.mp3');
    this.load.audio('bg_music', 'assets/sounds/surf-music.mp3');

    // All ninja wounds
    for (s in ninja_sounds) {
        this.load.audio(s, ninja_sounds[s]);
    }
    // All fx
    for (s in fx_sounds) {
        this.load.audio(s, fx_sounds[s]);
    }
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
    player = this.physics.add.sprite(200, 450, 'dude').setScale(1.5);
    player.jumps = 0;
    player.maxJumpVelocity = -500;
    player.setBounce(.2);
    player.body.gravity.y = 500;
    player.setDamping(true);
    player.setCollideWorldBounds(true);

    // ------------------------------------------------------------
    // Stars
    // ------------------------------------------------------------
    stars = this.physics.add.group();
    stars.inputEnableChildren = true;
    // stars.onEnterBounds.add(onEnterBounds, this);
    this.physics.add.collider(stars, platforms);
    // this.physics.add.collider(player, stars);
    generate_star();

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

    this.physics.add.overlap;

    // ------------------------------------------------------------
    // Allow player and platforms to collide into eachother
    // ------------------------------------------------------------
    this.physics.add.collider(player, platforms);
    // ------------------------------------------------------------
    // Explosion
    // ------------------------------------------------------------
    this.input.keyboard.on('keyup_B', function(event) {
        toggleBombing();
    }, this);


    // ------------------------------------------------------------
    // Bomb Collisions
    // ------------------------------------------------------------
    bombs = this.physics.add.group();
    // Ensure that the right thing happens when the player and the falling bomb collide
    // this.physics.overlap(player, boom, hurtPlayer, null, this);
    this.physics.add.collider(player, bombs, hurtPlayer, null, this);
    this.physics.add.collider(player, stars, grabStar, null, this);

    // Sounds
    soundHurt = this.sound.add('hurt');
    music = this.sound.add('music', { loop: false });
    bg_music = this.sound.add('bg_music', { loop: true });
    // all ninja sounds
    for (s in ninja_sounds) {
        soundBoard[s] = this.sound.add(s);
    }
    // All fx
    for (s in fx_sounds) {
        soundBoard[s] = this.sound.add(s);
    }
}

function update () {
    // Get a ref to the pointer
    // mp = game.input.mousePointer;
    mp = game.input.activePointer;
    let swiping_right = mp.isDown && mp.x > player.x && mp.downElement.tagName == 'CANVAS';
    let swiping_left = mp.isDown && mp.x < player.x && mp.downElement.tagName == 'CANVAS';
    let swiping_up = mp.isDown && mp.y < player.y && mp.downElement.tagName == 'CANVAS';

    // Test for player jumping state
    if(player.body.touching.down) {
        player.jumps = 0;
        player.isJumping = false;
    }


    // Test for conditions
    if ((cursors.up.isDown || swiping_up) && (!player.isJumping || player.jumps < 2)) {                       // Player is jumping
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

function throwStar(star) {
    const x = Phaser.Math.Between(50, 50);
    const y = Phaser.Math.Between(-50, 50);
    const drag = Phaser.Math.Between(.2, .98);
    const bounce = Phaser.Math.Between(1, 6);
    star.setBounce(bounce);
    star.setDragX(drag);
    star.setDamping(true);
    star.setVelocity(x, y);
    /**
    star.setAngularDrag(10) // spin an object
    star.setVelocityY(-200);    // A short hop up
    star.setGravityY(0);
    star.setVeloityX(500)
    star.body.mass = 500;
    star.body.gravity.y = 200;
    star.body.velocity.setTo(10,500);
    */
}

function grabStar(player, s) {
    // this.physics.add.tween(star).to( { alpha: 0 }, 2000, "Linear", true);


    // console.log('★★★★★★★★★★★★★★★★★★★★');
    // console.log(s);
    // console.log('★★★★★★★★★★★★★★★★★★★★');
    var tween = this.tweens.add({
        targets: s,
        alpha: 0,
        ease: 'Power1',
        duration: 50,
        yoyo: false,
        repeat: 0,
        onComplete: function () {
            generate_star(s.name);
            s.destroy();
        }
    });
    if (!soundBoard.shoot1.isPlaying) {
        soundBoard.shoot1.play();
    }

}

function hurtPlayer(player, boom) {
    incrementScoreBy(-1);
    let x = boom.x;
    let y = boom.y;
    boom.destroy();

    var expl = this.physics.add.sprite(x, y, 'boom').anims.play('explode');
    expl.anims.play('explode');
    soundHurt.setRate(1.5).play({volume:5});

    // Play the explosion after a short delay
    const fn = () => {
        music.play({volume:.5});
    }
    setTimeout(fn, 250);
}

function generate_star(src='anonymous'){
    if (src !== 'anonymous') {
        // alert(src);
    }
    if (stars.children.entries.length < 3) {
        config.stars++;
        let x = Phaser.Math.Between(200, game.canvas.width - 200);
        let y = 0;
        let n = `star_${new Date().getTime()}`
        // temp_star = stars.create(x, y, 'star').setScale(.3);
        temp_star = stars.create(x, y, 'star').setScale(.3);
        temp_star.name = n;
        temp_star.setFriction(1,1);
        temp_star.setDamping(true);
        temp_star.setDragX(.98);
        temp_star.setBounce(.3);
        temp_star.setCollideWorldBounds(true);
        // console.log('GENERATING A STAR!!!');
    }
}

function generate_bomb({
    min_x = player.x - 50,
    max_x = player.x + player.width + 50,
    min_y = (player.y - 150),
    max_y = player.y - 350,
    bomb_angle = Phaser.Math.Between(-30, 30),
    bomb_velocityX = Phaser.Math.Between(10, 50),
    bomb_velocityY = Phaser.Math.Between(10, 200)
} = {}) {

    const bomb_x = Phaser.Math.Between(min_x, max_x);
    const bomb_y = Phaser.Math.Between(min_y, max_y);
    var bomb = bombs.create(bomb_x, bomb_y, 'boom');
    bomb.anims.play('fall', true);
    bomb.setAngle(bomb_angle);
    bomb.setVelocityX(bomb_velocityX);
    bomb.setVelocityY(bomb_velocityY);
    bomb.setAngularAcceleration(Phaser.Math.Between(10, 30));
    // var bomb = bombs.create(player.x, player.y - 175, 'boom');
    config.bombs++;
}

function movePlayer(direction='right') {

    // console.log(`player.y: ${player.y}\n` +
    //     `------------`
    // );

    if (direction !== 'turn') {
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
    // if (direction !== 'up') {
    //     player.setVelocityY(0);
    // }
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
            jump();
            break;

        default:
            player.setVelocityX(0);
            player.anims.play('turn');
            break;

    }

}

function jump(should_jump=false, tolerance=150) {
    let withinTolerance = Math.abs(player.body.velocity.y - player.maxJumpVelocity) <= tolerance;
    if (player.body.touching.down) {
        // Reset player.jumps to 0
        should_jump = true;
    }
    // If player's y velocity is within 100 of maxVelocity
    // And his vertical height is below the midpoint of the canvas- it's ok to jump again
    else if (withinTolerance && player.y > (game.canvas.height/2)) {
        should_jump = true;
    }
    else {
        should_jump = false;
    }

    if (should_jump) {
        player.setVelocityY(player.maxJumpVelocity);
        player.isJumping = true;
        sayPhrase();
    }

    // or if the player's height is below
}

function range(min, max) {
    return Math.random() * (max - min) + min;
}


$(document).ready(function() {
    // Create the game
    config = {
        type: Phaser.AUTO,
        parent: 'game',
        autoCenter: true,
        width: dims.width,
        height: dims.height,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 400 },
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
        stars: 0,
        bombing: false
    };
    game = new Phaser.Game(config);

    // Resize the controls
    let controls = $('#controls');
    controls.css({ width: (config.width - 20) });

    let msg = JSON.stringify(getDimensions(), undefined, 2);
    $('#debugger').show().text(msg)
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
            // console.log(`ADDING BOMBING RUN WITH ID=${id}` );
            $('#btnPlay').text('Pause');
            // Play the bg music at a relatively low volume
            bg_music.play({volume:.3});
        }
    }
}

function sayPhrase(voice='ninja', phrase='you_underestimate_me') {
    const fn = () => soundBoard[phrase].setRate(1.5).play();
    if (!soundBoard[phrase].isPlaying) {
        setTimeout(fn, 250);
    }
}

function checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();
    return Phaser.Rectangle.intersects(boundsA, boundsB);
}

function onEnterBounds(sprite) {
    alert('foo');
}

// For shooting, possibly this...
// if (game.input.pointers[0].worldX && game.input.pointers[0].worldX ) {
//
// }
