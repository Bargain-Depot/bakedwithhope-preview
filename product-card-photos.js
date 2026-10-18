/* Product photos from Tina: files are expected at repository root once binary assets are uploaded. */
(()=>{
  'use strict';
  const assets={
    bar1:'cake-bar-white-chocolate-raspberry.webp',
    bar2:'cake-bar-white-chocolate-biscoff.webp',
    bar3:'cake-bar-cookies-and-cream.webp',
    bar4:'cake-bar-funfetti-kitty.webp'
  };
  const base='';
  for(const x of catalog){
    if(assets[x.id]){
      x.fallbackPhoto=x.img;
      x.img=base+assets[x.id];
      x.placeholder=false;
    }
  }
  if(!catalog.some(x=>x.id==='bar4')){
    catalog.push({id:'bar4',name:'Funfetti',type:'bars',img:base+assets.bar4,fallbackPhoto:'https://raw.githubusercontent.com/Bargain-Depot/bakedwithhope/main/funfetti.png',placeholder:false});
  }
  const drinks={
    'Strawberry Shortcake':'dirty-soda-strawberry-shortcake.webp',
    'Cherry Vanilla':'dirty-soda-cherry-vanilla.webp',
    'Shark Bite':'dirty-soda-shark-bite.webp'
  };
  function photo(img,fallback){
    img.addEventListener('error',function(){if(this.dataset.fallbackUsed)return;this.dataset.fallbackUsed='true';this.src=fallback},{once:true});
  }
  const priorSoda=renderSodas;
  renderSodas=function(){
    priorSoda();
    document.querySelectorAll('#builder [data-soda]').forEach(btn=>{
      const flavor=btn.dataset.soda;
      const path=drinks[flavor];
      if(!path)return;
      btn.classList.add('photo-soda-card');
      const img=document.createElement('img');
      img.className='soda-card-photo';
      img.src=base+path;
      img.alt=flavor+' dirty soda';
      img.loading='lazy';
      img.addEventListener('error',()=>{img.remove();btn.classList.remove('photo-soda-card')},{once:true});
      btn.prepend(img);
    });
    const illustration=document.querySelector('.soda-preview');
    if(illustration){
      const photoImage=document.createElement('img');
      photoImage.className='selected-soda-photo';
      photoImage.src=base+drinks[soda];
      photoImage.alt=soda+' dirty soda';
      photoImage.addEventListener('error',()=>photoImage.remove(),{once:true});
      const art=illustration.querySelector('.soda-illustration');
      if(art)art.replaceWith(photoImage);
      const placeholderMessage=[...illustration.querySelectorAll('p')].find(x=>x.textContent.includes('Actual drink photos coming soon'));
      if(placeholderMessage)placeholderMessage.textContent='Product photo from Baked with Hope';
    }
  };
  const priorRender=render;
  render=function(){
    priorRender();
    document.querySelectorAll('#builder .product img,#builder .mix-tile img').forEach(img=>{
      const product=catalog.find(x=>x.img===img.getAttribute('src'));
      if(product?.fallbackPhoto)photo(img,product.fallbackPhoto);
    });
  };
  render();
})();