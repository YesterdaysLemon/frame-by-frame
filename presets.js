/* Original, procedural motion studies. Angles are measured clockwise from down;
   forward kinematics keeps every bone length constant throughout each clip. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const lengths = [0, 94, 56, 53, 66, 53, 66, 80, 75, 80, 75];
  const parents = [-1, 0, 1, 1, 3, 1, 5, 0, 7, 0, 9];
  const neutral = {
    torso: 0, head: 0, leftArm: -.55, leftForearm: -.35,
    rightArm: .55, rightForearm: .35,
    leftLeg: -.22, leftShin: -.14, rightLeg: .22, rightShin: .14,
    x: 400, y: 350
  };

  function points(pose) {
    const p = Object.assign({}, neutral, pose);
    const angles = [0, Math.PI + p.torso, Math.PI + p.head,
      p.leftArm, p.leftForearm, p.rightArm, p.rightForearm,
      p.leftLeg, p.leftShin, p.rightLeg, p.rightShin];
    const result = [[p.x, p.y]];
    for (let i = 1; i < parents.length; i++) {
      const origin = result[parents[i]];
      result.push([origin[0] + Math.sin(angles[i]) * lengths[i],
        origin[1] + Math.cos(angles[i]) * lengths[i]]);
    }
    return result;
  }

  function figure(pose) {
    return {
      id: 1, color: '#000000', points: points(pose),
      templatePoints: points(neutral), scale: 100,
      widths: Array(11).fill(9),
      types: Array.from({ length: 11 }, (_, i) => i === 2 ? 'circle' : 'line'),
      fixed: Array(11).fill(false), hidden: Array(11).fill(false),
      filled: Array(11).fill(false)
    };
  }

  function clip(id, name, description, count, fps, pose) {
    return { id, name, description, fps,
      frames: Array.from({ length: count }, (_, i) => ({ figures: [figure(pose(i / count))] }))
    };
  }

  function gait(t, running) {
    const phase = TAU * t, swing = Math.sin(phase);
    const stride = running ? .93 : .57;
    const bend = running ? 1.8 : .9;
    const leftLeg = stride * swing, rightLeg = -stride * swing;
    const pose = {
      torso: running ? -.15 : -.04, head: running ? -.1 : 0,
      leftArm: -.12 - swing * (running ? .9 : .53),
      rightArm: .12 + swing * (running ? .9 : .53),
      leftForearm: -.25 - swing * (running ? .65 : .4) + (running ? 1.1 : .1),
      rightForearm: .25 + swing * (running ? .65 : .4) + (running ? 1.1 : .1),
      leftLeg, rightLeg,
      leftShin: leftLeg - Math.max(0, -swing) * bend,
      rightShin: rightLeg - Math.max(0, swing) * bend
    };
    // Keep the lower foot on one floor line; running adds a short flight phase.
    const feet = points(pose);
    pose.y = 350 + (500 - Math.max(feet[8][1], feet[10][1]));
    if (running) pose.y -= 14 * Math.pow(Math.abs(Math.cos(phase)), 4);
    return pose;
  }

  window.AnimationPresets = [
    clip('walk', 'Walk', 'A relaxed walk in place. Loop to keep walking.', 24, 18,
      t => gait(t, false)),
    clip('run', 'Run', 'A fast run in place with bent elbows and a flight phase.', 16, 20,
      t => gait(t, true)),
    clip('wave', 'Wave', 'A raised hand waves hello. Seamless repeating gesture.', 24, 12,
      t => ({ rightArm: 1.3, rightForearm: 2.8 + .38 * Math.sin(TAU * t * 2),
        leftArm: -.25, leftForearm: -.1,
        torso: -.035 * Math.sin(TAU * t), head: -.055,
        y: 350 + 1.5 * Math.sin(TAU * t) })),
    clip('jump', 'Jump', 'Crouch, jump and land. Repeats from the standing pose.', 24, 18,
      t => {
        const crouch = t < .25 ? Math.sin(t / .25 * Math.PI) :
          t > .75 ? Math.sin((t - .75) / .25 * Math.PI) : 0;
        const air = t >= .25 && t <= .75 ? Math.sin((t - .25) / .5 * Math.PI) : 0;
        const leg = .22 + .65 * crouch + .17 * air;
        const shin = -.14 - .8 * crouch;
        return { y: 350 + 46 * crouch - 90 * air,
          leftLeg: -leg, rightLeg: leg, leftShin: -shin, rightShin: shin,
          leftArm: -.4 - 1.7 * air, rightArm: .4 + 1.7 * air,
          leftForearm: -.2 - 2.5 * air, rightForearm: .2 + 2.5 * air,
          torso: .08 * crouch, head: .04 * crouch };
      }),
    clip('idle', 'Idle / breathe', 'A quiet breathing loop with a gentle sway.', 24, 10,
      t => {
        const breath = Math.sin(TAU * t), sway = Math.cos(TAU * t);
        return { torso: .024 * sway, head: -.012 * sway,
          leftArm: -.35 - .025 * breath, rightArm: .35 + .025 * breath,
          leftForearm: -.17 - .018 * breath, rightForearm: .17 + .018 * breath,
          y: 350 - 1.5 * breath };
      }),
    clip('bow', 'Bow', 'A courteous bow and return to standing. Repeat or play once.', 24, 12,
      t => {
        const bow = Math.pow((1 - Math.cos(TAU * t)) / 2, 1.3);
        return { torso: -.95 * bow, head: -1.15 * bow,
          leftArm: -.32 - .05 * bow, leftForearm: -.16 + .3 * bow,
          rightArm: .32 + .05 * bow, rightForearm: .16 + .3 * bow,
          y: 350 + 4 * bow };
      })
  ];
})();
