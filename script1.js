"use strict";
console.clear();

let canvas;
let scene;
let mouseVector;

// Optional: Scaling variables
let enemyScaleFactor = 0;
const scaleInterval = 1000; // Frames after which to scale
const scaleStep = 1; // Increment of radius
const healthScaleStep = 50; // Increment of maxHealth
const ENEMY_TYPES = [
    {
        name: "Red Goblin",
        color: { h: 0, s: 80, l: 40 }, // Red
        baseRadius: 70,
        baseHealth: 300,
        scaleFactor: 1.05, // Scaling multiplier per scaling interval
        healthScaleFactor: 50
    },
    {
        name: "Blue Orc",
        color: { h: 240, s: 80, l: 40 }, // Blue
        baseRadius: 30,
        baseHealth: 400,
        scaleFactor: 1.25,
        healthScaleFactor: 60
    },
    {
        name: "Green Troll",
        color: { h: 120, s: 80, l: 40 }, // Green
        baseRadius: 50,
        baseHealth: 550,
        scaleFactor: 1.5,
        healthScaleFactor: 75
    },
    // Add more enemy types as needed
];

function setup() {
    canvas = createCanvas(1200, 600);
    colorMode(HSL);
    restart();
}


function restart() {
    mouseVector = null;
    scene = new Scene({ health: 100, score: 0, gameOver: false, canAddTurretAtMouse: false, canvas });
    scene.add(new Turret(createVector(2 * width / 3, height / 2)));
    loop();

    // Reset scaling factors
    enemyScaleFactor = 0;
}

// In the Enemy class, upon removal:
if (this.health <= 0) {
    scene.data.score += 10; // Award points
    this.remove();
}

// Displaying the score
function draw() {
    // ... existing draw code ...

    // Draw score
    push();
    fill("white");
    textSize(24);
    textAlign(LEFT, TOP);
    text(`Score: ${scene.data.score}`, 10, 10);
    pop();
}


/**
 * Spawns an enemy with specified properties.
 * @param {object} color - HSL color object for the enemy.
 * @param {number} radius - Radius of the enemy (size).
 * @param {number} maxHealth - Maximum health of the enemy.
 * @param {object} enemyType - The type of enemy to spawn.
 */
function spawnEnemy(enemyType) {
    if (!enemyType) {
        // If no type is specified, select a random type
        enemyType = random(ENEMY_TYPES);
    }

    const { color, baseRadius, baseHealth } = enemyType;
    const startingPos = createVector(-baseRadius, random(10, height - 10));
    const angle = random(-QUARTER_PI, QUARTER_PI);
    const enemy = new Enemy(startingPos, angle, baseRadius, color, baseHealth, enemyType);
    scene.add(enemy);
}


function tryAddTurretAtMouse() {
    if (!scene.data.gameOver && scene.data.canAddTurretAtMouse) {
        scene.add(new Turret(mouseVector));
    }
}
function checkForGameOver() {
    if (scene.data.health <= 0) {
        scene.data.gameOver = true;
    }
    return scene.data.gameOver;
}
/**
 * ==============
 *  P5 Lifecycle
 * ==============
 */
function keyPressed() {
    if (key === "r") {
        restart();
    }
}

function mousePressed() {
    tryAddTurretAtMouse();
    scene.executeListeners("mousepressed");
}

function draw() {
    background(11);
    mouseVector = createVector(mouseX, mouseY);

    if (checkForGameOver()) {
        drawGameOver();
        return;
    }

    scene.update();

    // Scaling Logic: Scale enemies at defined intervals
    if (frameCount % scaleInterval === 1000) { // Adjust as per your original scaleInterval
        scene.getObjsByType("enemy").forEach(enemy => {
            enemy.scaleEnemy();
        });
    }

    // Enemy spawning logic
    if (frameCount % 30 === 0) { // Spawn every 30 frames (~0.5 seconds at 60 FPS)
        const enemyType = random(ENEMY_TYPES);
        spawnEnemy(enemyType);
    }

    // Draw hover turret
    scene.data.canAddTurretAtMouse = false;
    let hoverTurret;
    const turretNearMouse = scene.closest(mouseVector, "turret", 100);
    if (inBounds(mouseVector) && !turretNearMouse) {
        hoverTurret = new Turret(mouseVector);
        scene.data.canAddTurretAtMouse = true;
    }

    if (hoverTurret)
        hoverTurret.predraw();
    scene.draw();
    if (hoverTurret)
        hoverTurret.draw();

    // Draw health bar
    push();
    const healthHeight = map(scene.data.health, 0, 100, 0, height);
    rectMode(CENTER);
    noStroke();
    // Enhanced health bar with color transition
    const healthPercentage = scene.data.health / 100;
    const healthHue = map(healthPercentage, 0, 1, 0, 120); // 0 (red) to 120 (green)
    fill(healthHue, 100, 50);
    rect(width - 4, height / 2, 8, healthHeight);
    pop();

    // Draw score
    push();
    fill("white");
    textSize(24);
    textAlign(LEFT, TOP);
    text(`Score: ${scene.data.score || 0}`, 10, 10);
    pop();
}


function checkForGameOver() {
    if (scene.data.health <= 0) {
        scene.data.gameOver = true;
    }
    return scene.data.gameOver;
}

function drawGameOver() {
    scene.draw();
    // Draw GAME OVER text
    push();
    const NUM_LABELS = 5;
    const MAX_OFFSET = 4;
    const LABEL_OFFSET_X = map(mouseX, 0, width, MAX_OFFSET * 2, MAX_OFFSET);
    const LABEL_OFFSET_Y = map(mouseY, 0, height, MAX_OFFSET * 2, MAX_OFFSET);
    translate(-LABEL_OFFSET_X * NUM_LABELS, -LABEL_OFFSET_Y * NUM_LABELS);
    for (let i = 0; i < NUM_LABELS; i++) {
        translate(LABEL_OFFSET_X, LABEL_OFFSET_Y);
        const textColor = map(i, -1, NUM_LABELS - 1, 11, 100, true);
        noStroke();
        fill(textColor);
        textAlign(CENTER, CENTER);
        textSize(100);
        text("GAME OVER...R=Restart!", width / 2, height / 2);
        
    }
    pop();
}

function drawDebugValue(value, title) {
    const valueStr = title ? `[${title}: ${value}]` : `[${value}]`;
    noStroke();
    fill("lime");
    textSize(24);
    textAlign(LEFT, TOP);
    text(valueStr, 0, 0);
    const margin = textWidth("WWW");
    translate(ceil(textWidth(valueStr) / margin) * margin + 10, 0);
}

/**
 * =========
 *  Helpers
 * =========
 */
function inBounds(pos) {
    const oob = pos.x < 0 || pos.x > width || pos.y < 0 || pos.y > height;
    return !oob;
}

// Required for getTurnTowardsDiff()
function getAngleBetween(p1, p2) {
    return atan2(p2.y - p1.y, p2.x - p1.x);
}

// Required for getTurnTowardsDiff()
function normalizeAngle(a) {
    const positiveAngle = a < 0 ? TAU + a % TAU : a % TAU;
    return positiveAngle > PI ? positiveAngle - TAU : positiveAngle;
}

function getDistSq(p1, p2) {
    return sq(p2.x - p1.x) + sq(p2.y - p1.y);
}

/**
 * =========
 *  Classes
 * =========
 */
class Scene {
    constructor(data) {
        this.debugShowFrameRate = false;
        this.debugShowSceneObjsCount = false;
        this.objsData = {};
        this.data = Object.assign({}, data);
    }
    get objDataTypeIds() {
        return Object.keys(this.objsData);
    }
    get allObjs() {
        const allObjs = this.objDataTypeIds.map(id => this.getObjsByType(id)).flat();
        allObjs.sort((a, b) => a.zIndex - b.zIndex);
        return allObjs;
    }
    getObjsDataByType(typeId) {
        this._validateObjDataType(typeId);
        return this.objsData[typeId];
    }
    getObjsByType(typeId) {
        return this.getObjsDataByType(typeId).objs;
    }
    setObjsByType(typeId, objs) {
        const objsDataByType = this.getObjsDataByType(typeId);
        objsDataByType.objs = objs;
    }
    add(obj) {
        if (obj.scene === this) {
            throw new Error("This object was already added to the scene.");
        }
        obj.scene = this;
        this.getObjsByType(obj.typeId).push(obj);
        obj._dependencies.filter(dep => dep.scene !== this).forEach(dep => {
            this.add(dep);
        });
        return obj;
    }
    remove(typeId, id) {
        let objs = this.getObjsByType(typeId);
        const removeIndex = objs.findIndex(obj => obj.id === id);
        if (removeIndex === -1)
            return;
        const nextObjs = [...objs];
        const [objToRemove] = nextObjs.splice(removeIndex, 1);
        objToRemove.removeDependencies();
        objToRemove.scene = null;
        this.setObjsByType(typeId, nextObjs);
    }
    draw() {
        this.allObjs.forEach((obj) => obj._predraw());
        this.allObjs.forEach((obj) => obj._draw());
        // Debug statements
        push();
        translate(10, 10);
        if (this.debugShowFrameRate) {
            this.debugShowFrameRate__Buffer = this.debugShowFrameRate__Buffer || [];
            this.debugShowFrameRate__Buffer.push(frameRate());
            this.debugShowFrameRate__Buffer = this.debugShowFrameRate__Buffer.slice(-60);
            const fr = this.debugShowFrameRate__Buffer.reduce((acc, fr) => acc + fr, 0) / this.debugShowFrameRate__Buffer.length;
            drawDebugValue(fr.toFixed(0), "FPS");
        }
        if (this.debugShowSceneObjsCount) {
            drawDebugValue(this.allObjs.length, "Objs");
        }
        pop();
    }
    update() {
        this.allObjs.forEach((obj) => obj._update());
    }
    closestInfo(pos, typeId, range = Infinity, excludeObjs = []) {
        const objs = this.getObjsByType(typeId);
        const notFound = { closest: null, closestDist: Infinity };
        if (!objs)
            return notFound;
        let closest = null;
        let closestDistSq = Infinity;
        objs.forEach(obj => {
            if (excludeObjs.includes(obj))
                return;
            const distSq = getDistSq(pos, obj.pos);
            if (distSq < closestDistSq) {
                closestDistSq = distSq;
                closest = obj;
            }
        });
        const closestDist = sqrt(closestDistSq);
        if (closestDist > range) {
            return notFound;
        }
        return { closest, closestDist };
    }
    closest(pos, typeId, range, excludeObjs) {
        const { closest } = this.closestInfo(pos, typeId, range, excludeObjs);
        return closest;
    }
    _validateObjDataType(typeId) {
        // If objs data doesn't already exist for that type, add it.
        if (!this.objsData[typeId]) {
            this.objsData[typeId] = { typeId, objs: [] };
        }
    }
    executeListeners(event) {
        this.allObjs.forEach(obj => {
            const listeners = obj._listeners[event];
            if (listeners && listeners.length > 0) {
                listeners.forEach(listener => {
                    listener();
                });
            }
        });
    }
}
class SceneObj {
    constructor(pos, angle = 0, radius = 10) {
        this.typeId = "generic";
        this._scene = null;
        this._dependencies = [];
        this._listeners = {};
        this.zIndex = 0;
        this.id = `ID-${Math.random()}`;
        this.pos = pos.copy();
        this.angle = angle;
        this.radius = radius;
        this.createdFrame = frameCount;
    }
    get diameter() {
        return this.radius * 2;
    }
    get scene() {
        return this._scene;
    }
    set scene(scene) {
        if (scene && this._scene) {
            throw new Error("Tried overriding existing `scene` property with a new one. Object cannot be a part of two scenes");
        }
        this._scene = scene;
    }
    _predraw() {
        this.predraw();
    }
    predraw() { }
    _draw() {
        this.draw();
    }
    draw() { }
    _update() {
        this.update();
    }
    update() { }
    on(event, callback) {
        const regionalizedCallback = () => {
            if (this.mouseOver()) {
                callback();
            }
        };
        switch (event) {
            case "mousedown":
            case "mousepressed":
            case "mouseover":
                this._listeners[event] = this._listeners[event] || [];
                this._listeners[event].push(regionalizedCallback);
                break;
            default:
                throw new Error("Unknown event type " + event);
        }
    }
    off(event) {
        switch (event) {
            case "mousedown":
            case "mousepressed":
            case "mouseover":
                this._listeners[event] = [];
                break;
            default:
                throw new Error("Unknown event type " + event);
        }
    }
    addDependency(dep) {
        this._dependencies.push(dep);
        if (this.scene) {
            this.scene.add(dep);
        }
    }
    detachDependency(dep) {
        this._dependencies = this._dependencies.filter((dependency) => dep !== dependency);
    }
    removeDependencies() {
        this._dependencies.forEach(dependency => {
            dependency.remove();
        });
        this._dependencies = [];
    }
    remove() {
        if (this.scene) {
            this.scene.remove(this.typeId, this.id);
        }
    }
    closestInfo(typeId, range = Infinity) {
        return this.scene.closestInfo(this.pos, typeId, range, [this]);
    }
    closest(typeId, range) {
        return this.scene.closest(this.pos, typeId, range, [this]);
    }
    collides(typeId) {
        const { closest, closestDist } = this.closestInfo(typeId);
        if (!closest || closestDist > this.radius + closest.radius) {
            return null;
        }
        return closest;
    }
    mouseOver(padding = 0) {
        return dist(mouseX, mouseY, this.pos.x, this.pos.y) < (this.radius + padding);
    }
    // Required for both getTurnTowardsDirection() and getTurnTowardsAmount().
    // Use this function if you need the angle diff between the current object's 
    // angle and the direction of the towards position.
    getTurnTowardsDiff(towardsPos) {
        const desiredAngle = getAngleBetween(this.pos, towardsPos);
        const normObjAngle = normalizeAngle(this.angle);
        return normalizeAngle(desiredAngle - normObjAngle);
    }
    // Use this function if you only need the direction.
    getTurnTowardsDirection(towardsPos) {
        const angleDiff = this.getTurnTowardsDiff(towardsPos);
        return angleDiff > 0 ? "right" : "left";
    }
    // Use this function if you want the turning speed to be greater when 
    // the diff angle is bigger.
    getTurnTowardsAmount(towardsPos, maxTurnSpeed = .1, startSlowing = .1) {
        const angleDiff = this.getTurnTowardsDiff(towardsPos);
        const angleRange = map(startSlowing, 0, 1, 0, PI);
        return map(angleDiff, -angleRange, angleRange, -maxTurnSpeed, maxTurnSpeed, true);
    }
    turnTowards(towardsPos, maxTurnSpeed) {
        const turnAmount = this.getTurnTowardsAmount(towardsPos, maxTurnSpeed);
        this.angle += turnAmount;
    }
}
// ... [Scene, SceneObj classes as previously defined]

class Enemy extends SceneObj {
    /**
     * @param {p5.Vector} pos - Starting position of the enemy
     * @param {number} angle - Initial movement angle
     * @param {number} radius - Radius of the enemy (size)
     * @param {object} color - Color object with HSL properties
     * @param {number} maxHealth - Maximum health of the enemy
     * @param {object} enemyType - The type definition of the enemy
     */
    constructor(pos, angle = 0, radius = 12, color = { h: 0, s: 80, l: 40 }, maxHealth = 200, enemyType) {
        super(pos, angle || random(-QUARTER_PI, QUARTER_PI), radius);
        this.typeId = "enemy";
        this.zIndex = 5;
        this.speed = 0.05;
        this.maxHealth = maxHealth; // Set maxHealth from parameter
        this.health = this.maxHealth;
        this.color = color; // Store the color
        this.enemyType = enemyType; // Store the enemy type for scaling
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);

        // Draw health bar
        if (this.health < this.maxHealth) {
            stroke(120, 0.5);
            strokeWeight(2);
            const y = -this.diameter * 1.2;
            const xStart = -8;
            const xEnd = 8;
            line(xStart, y, xEnd, y);
            // Health bar color transitions from green to red based on health
            const healthPercentage = this.health / this.maxHealth;
            const healthHue = map(healthPercentage, 0, 1, 0, 120); // 0 (red) to 120 (green)
            stroke(healthHue, this.color.s, this.color.l, 0.8);
            line(xStart, y, map(this.health, 0, this.maxHealth, xStart, xEnd, true), y);
        }

        // Draw enemy
       // Draw enemy
        rotate(this.angle);
        scale(this.radius);
        noStroke();
        // left side
        fill(0, 80, 40);
        beginShape();
        vertex(1, 0);
        vertex(cos(QUARTER_PI * 5), sin(QUARTER_PI * 5));
        vertex(-.5, 0);
        endShape(CLOSE);
        // right side
        fill(0, 80, 50);
        beginShape();
        vertex(1, 0);
        vertex(cos(QUARTER_PI * 3), sin(QUARTER_PI * 3));
        vertex(-.5, 0);
        endShape(CLOSE);
        pop();

        // Different shapes based on enemy type
        switch (this.enemyType.name) {
            case "Red Goblin":
                fill(this.color.h, this.color.s, this.color.l - 10);
                // Goblin shape
                beginShape();
                vertex(1, 0);
                vertex(cos(QUARTER_PI * 5), sin(QUARTER_PI * 5));
                vertex(-0.5, 0);
                endShape(CLOSE);
                break;
            case "Blue Orc":
                fill(this.color.h, this.color.s, this.color.l - 5);
                // Orc shape (e.g., square)
                rectMode(CENTER);
                rect(0, 0, 1.5, 1.5);
                break;
            case "Green Troll":
                fill(this.color.h, this.color.s, this.color.l - 15);
                // Troll shape (e.g., triangle)
                beginShape();
                vertex(0, -1);
                vertex(1, 1);
                vertex(-1, 1);
                endShape(CLOSE);
                break;
            // Add more cases for additional enemy types
            default:
                // Default shape
                fill(this.color.h, this.color.s, this.color.l);
                circle(0, 0, 1);
                break;
        }

        pop();
    }

    update() {
        // Movement logic based on enemy type
        switch (this.enemyType.name) {
            case "Red Goblin":
                // Zig-zag movement
                this.angle += sin(frameCount * 0.05) * 0.01;
                break;
            case "Blue Orc":
                // Steadily increasing speed
                this.speed += 0.001;
                break;
            case "Green Troll":
                // Following a sine wave pattern
                this.pos.y += sin(frameCount * 0.05) * 0.5;
                break;
            // Add more cases for additional enemy types
        }

        // Common movement logic
        this.pos.add(createVector(cos(this.angle), sin(this.angle)).mult(this.speed));

        // ... [rest of the update method remains unchanged]
    
        // Existing movement logic...
        if (this.pos.y > height - 30) {
            // angle away from bottom wall
            this.angle += random(-0.02, 0);
        } else if (this.pos.y < 30) {
            // angle away from top wall
            this.angle += random(0, 0.02);
        } else {
            // random angle
            this.angle += random(-0.01, 0.01);
        }
        // keep direction forward
        this.angle = constrain(this.angle, -QUARTER_PI, QUARTER_PI);
        // move
        const moveBy = createVector(cos(this.angle), sin(this.angle)).mult(this.speed);
        this.pos.add(moveBy);
        // apply damage
        const collidedBullet = this.collides("bullet");
        if (collidedBullet) {
            this.health -= collidedBullet.damage;
            collidedBullet.remove();
        }
        // remove if dead
        if (this.health <= 0) {
            this.remove();
            // Optional: Add scoring or effects here
        }
        // remove if they reached the far wall
        if (this.pos.x >= width + this.radius) {
            this.scene.data.health -= this.health;
            this.remove();
        }
    }

    /**
     * Scales the enemy's size and health based on its type's scaling factors.
     */
    scaleEnemy() {
        // Apply scaling to radius
        this.radius *= this.enemyType.scaleFactor;
        
        // Apply scaling to maxHealth and current health
        this.maxHealth += this.enemyType.healthScaleFactor;
        this.health += this.enemyType.healthScaleFactor;

        // Optionally, increase speed or other attributes if desired
        // this.speed *= this.enemyType.speedScaleFactor || 1;
    }

    leadByPos(dist) {
        return createVector(cos(this.angle), sin(this.angle)).mult(dist).add(this.pos);
    }
}



class Bullet extends SceneObj {
    constructor(pos, angle, damage = 1) {
        super(pos, angle, 2);
        this.typeId = "bullet";
        this.zIndex = 2;
        this.damage = damage;
        this.speed = 4;
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        noStroke();
        fill(120);
        circle(0, 0, this.diameter);
        pop();
    }

    update() {
        this.radius = map(this.damage, 1, 20, 1, 10);
        const moveBy = createVector(cos(this.angle), sin(this.angle)).mult(this.speed);
        this.pos.add(moveBy);
        if (this.pos.x <= -this.radius ||
            this.pos.x >= width + this.radius ||
            this.pos.y <= -this.radius ||
            this.pos.y >= height + this.radius) {
            this.remove();
        }
    }
}

class Turret extends SceneObj {
    constructor(pos, range = 100) {
        super(pos, PI, 10);
        this.typeId = "turret";
        this.showMenu = false;
        this.turnSpeed = 0.01;
        this.fireEvery = 5;
        this.menuItems = [];
        this.damage = 1;
        this.zIndex = 1;
        this.range = range;
        const upgradeTypes = ["speed", "turnspeed", "range", "damage"];
        upgradeTypes.forEach((upgradeType, i) => {
            const a = map(i, -1, upgradeTypes.length, -PI - QUARTER_PI, QUARTER_PI);
            const pos = createVector(cos(a), sin(a))
                .mult(50)
                .add(this.pos.x, this.pos.y);
            const menuItem = new MenuItem(pos, this, upgradeType);
            this.menuItems.push(menuItem);
            this.addDependency(menuItem);
        });
    }

    get canUpgrade() {
        const cantUpgrade = !this.scene || frameCount - this.createdFrame < 50;
        return !cantUpgrade;
    }

    predraw() {
        push();
        translate(this.pos.x, this.pos.y);
        // Draw range
        noStroke();
        fill(14);
        circle(0, 0, this.range * 2);
        pop();
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        // Draw turret
        rotate(this.angle);
        scale(this.radius);
        noStroke();
        // left side
        fill(map(this.turnSpeed, 0.01, 0.1, 80, 30, true));
        const dipInX = map(this.fireEvery, 3, 20, 0.25, 1, true);
        beginShape();
        vertex(1, 0);
        vertex(cos(QUARTER_PI * 5), sin(QUARTER_PI * 5));
        vertex(-dipInX, 0);
        endShape(CLOSE);
        // right side
        fill(80);
        beginShape();
        vertex(1, 0);
        vertex(cos(QUARTER_PI * 3), sin(QUARTER_PI * 3));
        vertex(-dipInX, 0);
        endShape(CLOSE);
        pop();
    }

    update() {
        this.radius = map(this.damage, 1, 20, 10, 40);
        const closest = this.closest("enemy", this.range);
        if (closest) {
            const turnTowards = closest.leadByPos(14);
            this.turnTowards(turnTowards, this.turnSpeed);
            if (frameCount % this.fireEvery === 0) {
                this.shoot();
            }
        }
        // Decide when to show and hide upgrade menu
        if (this.canUpgrade && this.mouseOver()) {
            this.showMenu = true;
        }
        else if (!this.canUpgrade || !this.mouseOver(80)) {
            this.showMenu = false;
        }
    }

    shoot() {
        this.scene.add(new Bullet(this.getTipPos(), this.angle, this.damage));
    }

    getTipPos() {
        return createVector(cos(this.angle), sin(this.angle)).mult(this.radius).add(this.pos);
    }
}

class MenuItem extends SceneObj {
    constructor(pos, turret, upgrade) {
        super(pos, "menuitem", 20);
        this.zIndex = 10;
        this.upgrade = upgrade;
        this.turret = turret;
        this.on("mousepressed", this.handleMousePressed.bind(this));
    }

    handleMousePressed() {
        switch (this.upgrade) {
            case "speed":
                this.turret.fireEvery = constrain(this.turret.fireEvery - 1, 1, 10);
                break;
            case "turnspeed":
                this.turret.turnSpeed = constrain(this.turret.turnSpeed + 0.01, 0.01, 0.1);
                break;
            case "range":
                this.turret.range = constrain(this.turret.range + 10, 50, 2000);
                break;
            case "damage":
                this.turret.damage = constrain(this.turret.damage + 1, 1, 2000);
                break;
            default:
                throw new Error(`Unknown upgrade type ${this.upgrade}`);
        }
    }

    draw() {
        if (!this.turret.showMenu) {
            return;
        }
        push();
        translate(this.pos.x, this.pos.y);
        noStroke();
        fill(this.mouseOver() ? 80 : 40, 0.5);
        circle(0, 0, this.diameter);
        noStroke();
        fill("white");
        textSize(16);
        textAlign(CENTER, CENTER);
        switch (this.upgrade) {
            case "speed":
                text("👟", 0, 0);
                break;
            case "turnspeed":
                text("🛞", 0, 0);
                break;
            case "range":
                text("🏹", 0, 0);
                break;
            case "damage":
                text("⚔️", 0, 0);
                break;
            default:
                throw new Error(`Unknown upgrade type ${this.upgrade}`);
        }
        pop();
    }

    update() {
        // No additional update logic needed
    }
}
