'use strict';
// Ordered trees keep arbitrary figures portable while accepting legacy stickmen.
const Rig = (() => {
  const legacy = [-1,0,1,1,3,1,5,0,7,0,9];
  const copy = p => p.map(q => q.slice());
  const topology = f => f.parents || legacy;
  function descendant(parents, ancestor, joint) {
    while (joint > 0 && joint !== ancestor) joint = parents[joint];
    return joint === ancestor;
  }
  function validFigure(f) {
    if (!f || !Number.isSafeInteger(f.id) || f.id < 0 || f.id >= 1e9 || !/^#[0-9a-f]{6}$/i.test(f.color)) return false;
    const p = f.points, n = p?.length;
    const points = a => Array.isArray(a) && a.length === n && a.every(q => Array.isArray(q) && q.length === 2 && q.every(v => Number.isFinite(v) && Math.abs(v) < 100000));
    if (!Array.isArray(p) || n < 1 || n > 128 || !points(p)) return false;
    if (f.parents === undefined ? n !== 11 : !Array.isArray(f.parents) || f.parents.length !== n || f.parents.some((v,i) => !Number.isInteger(v) || (i === 0 ? v !== -1 : v < 0 || v >= i))) return false;
    if (f.templatePoints !== undefined && !points(f.templatePoints)) return false;
    if (f.name !== undefined && (typeof f.name !== 'string' || f.name.length > 60)) return false;
    if (f.scale !== undefined && (!Number.isFinite(f.scale) || f.scale < 10 || f.scale > 400)) return false;
    return ['widths','types','fixed','hidden','filled','pinned'].every(k => f[k] === undefined || (Array.isArray(f[k]) && f[k].length === n && f[k].every(v => k === 'widths' ? Number.isFinite(v) && v >= 1 && v <= 40 : k === 'types' ? ['line','circle'].includes(v) : typeof v === 'boolean')));
  }
  function pose(f, joint, target, mode = 'pull', snap = false) {
    const original = f.points, result = copy(original), parents = topology(f);
    if (joint === 0) return original.map(p => [p[0]+target[0]-original[0][0], p[1]+target[1]-original[0][1]]);
    if (f.fixed?.[joint] || f.pinned?.[joint]) return result;
    // A pinned descendant locks this branch; moving another branch remains free.
    if (original.some((_,i) => f.pinned?.[i] && descendant(parents,joint,i))) return result;
    const children = i => parents.reduce((n,p,j) => n + (j > 0 && p === i ? 1 : 0), 0);
    let chain = [joint], a = parents[joint];
    chain.push(a);
    while (a > 0 && children(a) === 1 && !f.pinned?.[a] && !f.fixed?.[a]) { a = parents[a]; chain.push(a); }
    chain.reverse();
    const tip=parents.findIndex((p,i)=>i>0&&p===joint);
    if(mode==='pull'&&children(joint)===1&&children(tip)===0&&!f.fixed?.[tip]){
      // An elbow/knee is a bend control, not a rigid rotation of both bones.
      // Keep the shoulder/hip planted; let the hand/foot move only as much as
      // the lower bone's length requires. This allows either bend direction.
      const anchor=original[parents[joint]],middle=original[joint],end=original[tip];
      const upper=Math.hypot(middle[0]-anchor[0],middle[1]-anchor[1]),lower=Math.hypot(end[0]-middle[0],end[1]-middle[1]);
      let angle=Math.atan2(target[1]-anchor[1],target[0]-anchor[0]);
      if(snap)angle=Math.round(angle/(Math.PI/12))*Math.PI/12;
      const next=[anchor[0]+Math.cos(angle)*upper,anchor[1]+Math.sin(angle)*upper];
      const dx=end[0]-next[0],dy=end[1]-next[1];
      const lowerAngle=Math.hypot(dx,dy)>1e-9?Math.atan2(dy,dx):Math.atan2(end[1]-middle[1],end[0]-middle[0]);
      result[joint]=next;
      result[tip]=[next[0]+Math.cos(lowerAngle)*lower,next[1]+Math.sin(lowerAngle)*lower];
      return result;
    }
    if (mode === 'pull' && children(joint) === 0 && chain.length > 2) {
      const q = chain.map(i => original[i].slice()), anchor = q[0].slice();
      const lengths = q.slice(1).map((p,i) => Math.hypot(p[0]-q[i][0],p[1]-q[i][1]));
      const length = lengths.reduce((x,y) => x+y,0), distance = Math.hypot(target[0]-anchor[0], target[1]-anchor[1]);
      const place = (from,to,len,fallback) => { const dx=to[0]-from[0],dy=to[1]-from[1],d=Math.hypot(dx,dy); return d>1e-9 ? [from[0]+dx*len/d,from[1]+dy*len/d] : [from[0]+Math.cos(fallback)*len,from[1]+Math.sin(fallback)*len]; };
      if (distance >= length-1e-6) {
        for (let i=1;i<q.length;i++) q[i]=place(q[i-1],target,lengths[i-1],Math.PI/2);
      } else if (q.length === 3) {
        // Exact two-bone IK retains the bend side even near full extension.
        const l=lengths[0],r=lengths[1],d=Math.max(Math.abs(l-r)+1e-7,Math.min(l+r-1e-7,distance));
        const angle=distance>1e-9?Math.atan2(target[1]-anchor[1],target[0]-anchor[0]):Math.atan2(q[2][1]-anchor[1],q[2][0]-anchor[0]);
        const cross=(q[2][0]-anchor[0])*(q[1][1]-anchor[1])-(q[2][1]-anchor[1])*(q[1][0]-anchor[0]);
        const offset=Math.acos(Math.max(-1,Math.min(1,(l*l+d*d-r*r)/(2*Math.max(l*d,1e-9)))))*(cross<0?-1:1);
        q[1]=[anchor[0]+Math.cos(angle+offset)*l,anchor[1]+Math.sin(angle+offset)*l];
        q[2]=[anchor[0]+Math.cos(angle)*d,anchor[1]+Math.sin(angle)*d];
      } else {
        // A perfectly straight chain needs a bend seed to escape the collinear
        // FABRIK fixed point when the pointer pulls back along the same line.
        const direction=distance>1e-9?target:q.at(-1),angle=Math.atan2(direction[1]-anchor[1],direction[0]-anchor[0]);
        const nx=-Math.sin(angle),ny=Math.cos(angle);
        if(q.slice(1,-1).every(p=>Math.abs((p[0]-anchor[0])*nx+(p[1]-anchor[1])*ny)<1e-6)){
          for(let i=1;i<q.length-1;i++){const bend=Math.sin(Math.PI*i/(q.length-1))*Math.max(1,length*.08);q[i][0]+=nx*bend;q[i][1]+=ny*bend}
        }
        for (let iteration=0;iteration<120;iteration++) {
          q[q.length-1]=target.slice();
          for (let i=q.length-2;i>=0;i--) q[i]=place(q[i+1],q[i],lengths[i],Math.PI);
          q[0]=anchor.slice();
          for (let i=1;i<q.length;i++) q[i]=place(q[i-1],q[i],lengths[i-1],0);
          if (Math.hypot(q.at(-1)[0]-target[0],q.at(-1)[1]-target[1])<.001) break;
        }
      }
      chain.forEach((index,i) => result[index]=q[i]);
      return result;
    }
    const o=original[parents[joint]],old=Math.atan2(original[joint][1]-o[1],original[joint][0]-o[0]);
    let angle=Math.atan2(target[1]-o[1],target[0]-o[0]);
    if (snap) angle=Math.round(angle/(Math.PI/12))*Math.PI/12;
    const cos=Math.cos(angle-old),sin=Math.sin(angle-old);
    return original.map((p,i) => { if (!descendant(parents,joint,i)) return p.slice(); const x=p[0]-o[0],y=p[1]-o[1];return [o[0]+x*cos-y*sin,o[1]+x*sin+y*cos]; });
  }
  return {topology,descendant,validFigure,pose};
})();
if (typeof module !== 'undefined') module.exports=Rig;
