const assert=require('node:assert/strict'),Rig=require('./rig.js');
const f={id:1,color:'#000000',points:[[0,0],[0,-94],[0,-150],[-38,-58],[-65,3],[38,-58],[65,3],[-30,74],[-51,146],[30,74],[51,146]]};
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
assert(Rig.validFigure(f),'legacy saves still load');
for(const target of [[85,-45],[30,-90],[500,-300],[0,-94],[0,100]]){
 const posed=Rig.pose(f,6,target);for(const i of [0,1,2,3,4,7,8,9,10])assert.deepEqual(posed[i],f.points[i],'other branches stay planted');
 for(const i of [5,6])assert(Math.abs(dist(posed[i],posed[Rig.topology(f)[i]])-dist(f.points[i],f.points[Rig.topology(f)[i]]))<1e-4,'limb lengths preserved');
}
const target=[85,-45],posed=Rig.pose(f,6,target);assert(dist(posed[6],target)<1e-4,'reachable hand tracks pointer');
assert.deepEqual(Rig.pose({...f,pinned:Array.from({length:11},(_,i)=>i===6)},6,target),f.points,'pinned hand stays fixed');
const rotated=Rig.pose(f,5,[85,-45],'rotate');for(const i of [0,1,2,3,4,7,8,9,10])assert.deepEqual(rotated[i],f.points[i]);
// Direct elbow/knee edits must change the bend, rather than rotate a rigid limb.
for(const joint of [3,5,7,9]){
 const tip=joint+1,parent=Rig.topology(f)[joint],o=f.points[parent],upper=dist(o,f.points[joint]),lower=dist(f.points[joint],f.points[tip]),sides=new Set(),bends=[];
 for(let k=0;k<16;k++){
  const angle=k*Math.PI/8,target=[o[0]+Math.cos(angle)*upper,o[1]+Math.sin(angle)*upper],p=Rig.pose(f,joint,target);
  assert(dist(p[joint],target)<1e-6,'middle joint tracks the pointer through every orientation');
  assert(Math.abs(dist(p[joint],p[parent])-upper)<1e-6);assert(Math.abs(dist(p[tip],p[joint])-lower)<1e-6);
  for(let i=0;i<p.length;i++)if(i!==joint&&i!==tip)assert.deepEqual(p[i],f.points[i],'other joints stay planted');
  const cross=(p[joint][0]-o[0])*(p[tip][1]-p[joint][1])-(p[joint][1]-o[1])*(p[tip][0]-p[joint][0]);if(Math.abs(cross)>1e-5)sides.add(Math.sign(cross));
  bends.push(dist(p[tip],o));
 }
 assert.equal(sides.size,2,'elbows and knees can bend both ways');
 assert(Math.max(...bends)-Math.min(...bends)>10,'the bend angle changes during direct dragging');
}
const tree={id:2,color:'#111111',parents:[-1,0,1,2,0],points:[[0,0],[40,20],[70,50],[100,50],[-20,20]]};assert(Rig.validFigure(tree));
const bent=Rig.pose(tree,3,[50,50]);assert(dist(bent[3],[50,50])<.01);for(let i=1;i<tree.points.length;i++)assert(Math.abs(dist(bent[i],bent[tree.parents[i]])-dist(tree.points[i],tree.points[tree.parents[i]]))<1e-4);assert.deepEqual(bent[4],tree.points[4]);
assert(Rig.validFigure({id:2,color:'#000000',points:[[0,0]],parents:[-1]}),'blank origin is valid');
for(const parents of [[-1,1,0,0,0],[-1,2,1,0,0],[-1,0,5,0,0]])assert(!Rig.validFigure({...tree,parents}),'cycles and invalid parent indices rejected');
assert(!Rig.validFigure({...tree,points:[[NaN,0],...tree.points.slice(1)]}));assert(!Rig.validFigure({...tree,widths:[9]}));
const straight={id:3,color:'#000000',parents:[-1,0,1,2],points:[[0,0],[100,0],[200,0],[300,0]]};
for(const t of [[150,0],[0,0]]){const p=Rig.pose(straight,3,t);assert(dist(p[3],t)<.01,'straight custom chain bends when pulled inward');for(let i=1;i<p.length;i++)assert(Math.abs(dist(p[i],p[i-1])-100)<1e-4)}
console.log('Rig checks passed: legacy/custom validation, anchored IK, exact lengths, pins, rotation, malformed imports.');
