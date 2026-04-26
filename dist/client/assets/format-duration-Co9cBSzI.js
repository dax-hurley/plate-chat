function a(n){const t=Math.max(0,Math.round(n)),o=Math.floor(t/60),r=t%60;return o===0?`${r}s`:`${o}:${r.toString().padStart(2,"0")}`}export{a as f};
