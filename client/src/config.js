// One place to edit your basics. Everything else reads from here.
export const CONFIG = {
  name: 'Aasia Asadullah',
  tagline: 'Game developer and animator. I build worlds and bring them to life.',
  avatarPath: '/models/avatar.glb',

  // Look: cartoon/anime shading
  toon: true,          // flat cel-shaded materials
  outline: true,       // ink outline around the avatar
  toonSteps: 3,        // number of shading bands (2 = very flat, 4 = softer)

  // Avatar behaviour
  avatarHeight: 1.8,
  followMouse: true,
  headBoneHint: /head/i,   // name pattern used to find the head bone
  idleClipHint: /idle|breath|stand/i,

  // Gestures (Step 5). Open the site with ?debug to tune these live.
  reactions: true,         // click / hover / section reactions
  speechBubbles: true,     // little comic speech bubbles
  armBoneHint: /arm|shoulder|hand|clavicle/i,
  armAxis: 'z',            // which axis raises the arm when waving: 'x' | 'y' | 'z'
  armSign: 1,              // flip to -1 if the arm swings the wrong way
  armRaise: 2.4,           // how far the arm lifts, in radians
};
