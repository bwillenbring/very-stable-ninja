var config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
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
    }
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

// ------------------------------------------------------------
// PRELOAD
// ------------------------------------------------------------
function preload () {
    // Static images 
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');

    // Animated Sprites
    this.load.spritesheet('dude', 'assets/ninja.png', { frameWidth: 64, frameHeight: 96 });
    this.load.spritesheet('boom', 'assets/sprites/bomb-twirling.png', { frameWidth: 64, frameHeight: 64, endFrame: 28 });

    // Sounds 
    this.load.audio('hurt', 'assets/sounds/hurt.mp3');
    this.load.audio('music', 'assets/sounds/explosion.mp3');
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
    // Ground platform
    platforms.create(400, 800, 'ground').setScale(4,1).refreshBody();
    // All the way to the right
    platforms.create(1000, 500, 'ground');
    // Upper left
    platforms.create(50, 250, 'ground');
    // Highest platform
    platforms.create(650, 320, 'ground').setScale(.75,1).refreshBody();

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
        console.log('Bombs away!!!');
        generate_bomb();
    }, this);

    this.input.keyboard.on('keyup_UP', function(event) {
        player.body.gravity.y = 1000;
    });
    this.input.keyboard.on('keydown_UP', function(event) {
        player.setVelocityY(-500);
        player.body.gravity.y  = config.physics.arcade.gravity.y;
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
}

function update () {
    
    if (cursors.left.isDown) {
        player.setVelocityX(-260);
        player.anims.play('goLeft', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(260);
        player.anims.play('goRight', true);
    }
    else{
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    // Player jump 
    if (cursors.up.isDown) {
        if (player.y > 300) {
            player.body.gravity.y -= 6;
        }
        if (player.body.touching.down) {
            // player.setVelocityY(-330);
        }
    }
}



function hurtPlayer(player, boom) {
    // 
    console.log('hurt player!!!');
    let x = boom.x;
    let y = boom.y;
    boom.destroy();

    var expl = this.physics.add.sprite(x, y, 'boom').anims.play('explode');
    expl.anims.play('explode');
    soundHurt.play({volume:5});
    const fn = () => {
        music.play({volume:.5});
    }
    // music.play();
    setTimeout(fn, 250);
}

function generate_bomb() {
    // boom = this.physics.add.sprite(player.x, (player.y-100 - player.height), 'boom');
    var bomb = bombs.create(player.x, (player.y-100 - player.height), 'boom');
    // this.physics.add.collider(boom, platforms);
    // this.physics.add.collider(boom, player);
    bomb.anims.play('fall', true);
}
