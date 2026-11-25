/* Le feu de la prière : flammes au bas de l'écran, vagues de lumière en haut, braises qui montent. */
window.FEU = (() => {
  const c = document.getElementById('feu'), gl = c.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  const etat = { souffle: 0, chaleur: 1 };
  if (!gl) { document.documentElement.classList.add('sans-gl'); return etat; }
  const F = `precision highp float;uniform vec2 r;uniform float t,s,k,p;
  float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float a=.5,v=0.;mat2 m=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){v+=a*n(p);p=m*p*2.03;a*=.5;}return v;}
  float braises(vec2 u,float e,float vit,float seuil){u.y-=t*vit;u.x+=sin(u.y*2.+t*.4)*.12;vec2 g=u*e,i=floor(g),f=fract(g)-.5;float a=h(i+7.3);if(a<seuil)return 0.;vec2 o=vec2(h(i)-.5,h(i+3.1)-.5)*.7;float d=length(f-o);return smoothstep(.09,.0,d)*(.45+.55*sin(t*(2.+4.*a)+a*40.));}
  void main(){
    vec2 q=gl_FragCoord.xy/r,u=q;u.x*=r.x/r.y;
    vec3 col=mix(vec3(.058,.0,.155),vec3(.115,.012,.30),smoothstep(0.,1.,q.y));
    // vagues de lumière
    for(int i=0;i<3;i++){float fi=float(i);float y=.80-.13*fi+.07*sin(u.x*(1.3+.5*fi)+t*(.22+.06*fi)+fi*2.1)+.15*(fbm(vec2(u.x*1.1+t*.07,fi*9.+t*.04))-.5);
      float d=q.y-y;float l=exp(-abs(d)*(d>0.?9.:22.))*(.27+.13*sin(t*.31+fi*1.9+u.x));
      l+=exp(-abs(d)*130.)*.20*(.6+.4*sin(u.x*2.-t*.5+fi));
      col+=l*(i==0?vec3(.22,.52,.95):i==1?vec3(.55,.10,.98):vec3(.92,.12,.95))*(.75+.6*s);}
    // faisceaux
    float fx=fbm(vec2(u.x*5.+t*.03,1.7+t*.05));col+=vec3(.35,.12,.85)*pow(fx,4.)*.9*smoothstep(0.,.6,q.y);
    // flammes : langues étirées, déformées par un second bruit, qui montent plus haut sur les bords
    float bord=pow(abs(q.x-.5)*2.,2.4);
    float l=n(vec2(u.x*1.3+t*.12,t*.26)),l2=n(vec2(u.x*3.4-t*.2,t*.5+9.));
    float haut=(.19+.27*bord+.14*s)*k*mix(1.,.86,p)*(.55+.6*l+.45*l2);
    float y=q.y/max(haut,.04);
    vec2 w=vec2(u.x*2.6,q.y*2.2-t*.55);float w1=fbm(w)-.5,w2=fbm(w*1.9+vec2(5.2,-t*.35))-.5;
    float f=fbm(vec2(u.x*5.2+w1*2.2+w2*.8,q.y*2.6-t*1.05+w2*1.1));
    float fin=n(vec2(u.x*15.+w1*7.,q.y*6.-t*2.3));
    float fl=f*1.55+fin*.16+.30-y*(.62+.25*f);
    float c0=smoothstep(.02,.42,fl),c1=smoothstep(.25,.58,fl),c2=smoothstep(.50,.92,fl),c3=smoothstep(.86,1.30,fl);
    col=mix(col,vec3(.36,.03,.66),c0*.78);col=mix(col,vec3(.90,.07,.62),c1*.88);col=mix(col,vec3(.99,.33,.17),c2*.90);col=mix(col,vec3(1.,.70,.28),c3*.85);
    col+=vec3(.70,.10,.60)*exp(-q.y*4.6)*.30*(.8+.35*n(vec2(t*.7,3.))+s*.8);
    // braises
    float b=braises(u,6.,.085,.80)+.8*braises(u+3.7,10.,.055,.84)+.6*braises(u+9.1,16.,.04,.88);
    col+=vec3(1.,.62,.32)*max(b,0.)*smoothstep(1.,.25,q.y)*(.75+s);
    // lumière qui balaie au changement de sujet
    float bl=(q.x-(1.3-1.6*s))*3.2;col+=vec3(.95,.55,1.)*s*s*.35*exp(-bl*bl);
    // zone calme pour lire
    float calme=smoothstep(.12,.45,q.y)*(1.-smoothstep(.80,1.,q.y));col*=1.-.38*calme*p;
    col*=mix(1.,.95-.10*smoothstep(.80,.60,q.x),p);
    col*=mix(.34,1.,smoothstep(.0,.10,q.y));
    col*=.86+.14*smoothstep(1.2,.3,length((q-.5)*vec2(1.2,1.)));
    col+=(h(gl_FragCoord.xy+fract(t))-.5)*.012;
    gl_FragColor=vec4(col,1.);}`;
  const sh = (ty, src) => { const o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  let pr;
  try { pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}')); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, F)); gl.linkProgram(pr); gl.useProgram(pr); } catch (e) { console.warn(e.message); document.documentElement.classList.add('sans-gl'); return etat; }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const la = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(la); gl.vertexAttribPointer(la, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(pr, n), ur = U('r'), ut = U('t'), us = U('s'), uk = U('k'), up = U('p');
  let ech = 0.5, lents = 0, dernier = 0;
  const taille = () => { const m = Math.min(ech, 960 / Math.max(innerWidth, innerHeight)); c.width = Math.max(160, Math.round(innerWidth * m)); c.height = Math.max(160, Math.round(innerHeight * m)); gl.viewport(0, 0, c.width, c.height); };
  addEventListener('resize', taille); taille();
  const fixe = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now() - 40000;
  function img(t) {
    if (!fixe) requestAnimationFrame(img);
    if (t - dernier < 30) return;
    const dt = t - dernier; dernier = t;
    // appareil lent : on baisse la définition, jamais la fluidité
    if (dt > 55 && dt < 400) { if (++lents > 40 && ech > 0.2) { ech *= 0.75; lents = 0; taille(); } } else lents = Math.max(0, lents - 0.5);
    etat.souffle *= Math.exp(-Math.min(dt, 200) / 1500);
    gl.uniform2f(ur, c.width, c.height); gl.uniform1f(ut, (t - t0) / 1000 % 2000); gl.uniform1f(us, etat.souffle); gl.uniform1f(uk, etat.chaleur); gl.uniform1f(up, document.body.dataset.etat === 'priere' ? 1 : 0.35);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(img);
  c.addEventListener('webglcontextlost', () => document.documentElement.classList.add('sans-gl'));
  return etat;
})();
