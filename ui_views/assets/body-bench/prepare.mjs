import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const source=path.join(root,'.temp/threejs-playground/public/assets/simhuman/ubc-female.glb');
const file=fs.readFileSync(source);
const jsonLength=file.readUInt32LE(12);
const doc=JSON.parse(file.subarray(20,20+jsonLength).toString());
const bin=file.subarray(28+jsonLength);
const mesh=doc.meshes.find(m=>m.name==='Superhero_Female') || doc.meshes.find(m=>doc.accessors[m.primitives[0].attributes.POSITION].count>5000);
const p=mesh.primitives[0];
function accessor(id){const a=doc.accessors[id],v=doc.bufferViews[a.bufferView];const count={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];const bytes={5126:4,5125:4,5123:2,5121:1}[a.componentType];const out=[];for(let i=0;i<a.count;i++)for(let j=0;j<count;j++){const offset=(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||bytes*count)+j*bytes;out.push(a.componentType===5126?bin.readFloatLE(offset):a.componentType===5125?bin.readUInt32LE(offset):a.componentType===5123?bin.readUInt16LE(offset):bin.readUInt8(offset));}return out;}
const pos=accessor(p.attributes.POSITION),norm=accessor(p.attributes.NORMAL),indices=accessor(p.indices);
const vertices=[],normals=[];
function clip(poly,y,above){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],inside=above?a[1]>=y:a[1]<=y,next=above?b[1]>=y:b[1]<=y;if(inside)out.push(a);if(inside!==next){const t=(y-a[1])/(b[1]-a[1]);out.push(a.map((v,j)=>v+(b[j]-v)*t));}}return out;}
for(let i=0;i<indices.length;i+=3){let poly=indices.slice(i,i+3).map(k=>[...pos.slice(k*3,k*3+3),...norm.slice(k*3,k*3+3)]);poly=clip(clip(poly,1.15,true),2.15,false);for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]]){vertices.push(...v.slice(0,3).map(x=>+x.toFixed(6)));normals.push(...v.slice(3).map(x=>+x.toFixed(6)));}}
const out=path.join(root,'ui_views/assets/body-bench/body.json');fs.writeFileSync(out,JSON.stringify({positions:vertices,normals}));console.log(JSON.stringify({vertices:vertices.length/3,bytes:fs.statSync(out).size,sourceMesh:mesh.name}));
