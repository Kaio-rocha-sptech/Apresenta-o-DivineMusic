/* Estados documentais e inspeção de imagens. Textos somente em content/slides.js. */
(function () {
  'use strict';
  var D=window.Deck,ui=D.ui,L=D.layouts,t=ui.t,esc=ui.esc;
  function each(xs,fn){return (xs||[]).map(fn).join('');}
  function note(c){return '<p class="document-status">'+t(c.statusLabel)+'</p>';}

  L.documented={
    render:function(s){var c=s.content||{},hasMedia=!!(s.media&&s.media.src);
      return ui.decor('grid')+'<div class="slide-inner documented '+(hasMedia?'has-media':'')+'">'+
        '<div class="documented-intro">'+ui.header(s,c.lead)+note(c)+'</div>'+
        '<div class="documented-content">'+
        (hasMedia?'<figure class="documented-media" data-anim="card">'+ui.media(s.media,{fit:'contain'})+'</figure>':'')+
        '<div class="documented-panels">'+each(c.panels,function(p,i){return '<section class="documented-panel" data-anim="card" style="--i:'+i+'"><span class="panel-index">0'+(i+1)+'</span><h3>'+t(p.title)+'</h3><p>'+t(p.text)+'</p></section>';})+'</div></div></div>';
    }
  };

  L.inspector={
    render:function(s){var c=s.content||{},entries=c.entries||[],m=s.media||{},wh=c.imageSize||[1,1];
      return ui.decor('blocks')+'<div class="slide-inner inspector'+(c.presentationMode==='wide'?' inspector-wide':'')+'">'+
        '<div class="inspector-side">'+ui.header(s,c.lead)+'<div class="inspector-options" role="group" aria-label="'+esc(c.inspectorLabel)+'">'+
        each(entries,function(en,i){return '<button class="inspector-option" data-i="'+i+'" aria-pressed="false">'+t(en.label)+'</button>';})+'</div>'+
        '<div class="inspector-detail" aria-live="polite"></div><button class="btn inspector-zoom"><img class="on-light-icon" src="assets/icons/zoom.svg" alt="">Ampliar diagrama</button></div>'+
        '<figure class="inspector-figure" data-anim="card"><div class="inspector-image" style="aspect-ratio:'+wh[0]+'/'+wh[1]+'">'+
        '<img src="'+esc(m.src)+'" alt="'+esc(m.alt)+'">'+each(entries,function(en,i){var r=en.rect;return '<button class="inspector-region" data-i="'+i+'" aria-label="Destacar '+esc(en.label)+'" aria-pressed="false" style="left:'+100*r[0]/wh[0]+'%;top:'+100*r[1]/wh[1]+'%;width:'+100*(r[2]-r[0])/wh[0]+'%;height:'+100*(r[3]-r[1])/wh[1]+'%"></button>';})+'</div><figcaption>'+t(c.caption)+'</figcaption></figure></div>';
    },
    mount:function(el,s){var c=s.content||{},entries=c.entries||[],detail=el.querySelector('.inspector-detail');
      function show(i){el.querySelectorAll('[data-i]').forEach(function(b){b.setAttribute('aria-pressed',String(+b.dataset.i===i));});
        detail.innerHTML=i<0?'<p>Selecione um item para conferir seu papel no diagrama.</p>':'<h3>'+t(entries[i].label)+'</h3><p>'+t(entries[i].text)+'</p>';
      }
      el._inspect=show;
      el.addEventListener('click',function(e){var b=e.target.closest('[data-i]');if(b){show(b.getAttribute('aria-pressed')==='true'?-1:+b.dataset.i);}});
      el.querySelector('.inspector-zoom').addEventListener('click',function(e){D.modal.open({title:s.title,src:s.media.src,alt:s.media.alt,origin:e.currentTarget});});
      show(-1);
    },reset:function(el){el._inspect(-1);},escape:function(el){if(el.querySelector('[aria-pressed="true"]')){el._inspect(-1);return true;}return false;}
  };

  L.jwtConcept={
    render:function(s){var c=s.content||{};
      return ui.decor('grid')+'<div class="slide-inner jwt-concept">'+ui.header(s,c.lead)+
      '<div class="jwt-concept-body"><div class="jwt-route" aria-hidden="true"><div class="jwt-route-line"></div>'+each(c.concepts,function(p,i){return '<span class="jwt-route-point p'+i+'">'+esc(String(i+1).padStart(2,'0'))+'</span>';})+'</div>'+
      '<div class="concept-tabs" role="tablist" aria-label="Autenticação e JWT">'+each(c.concepts,function(p,i){return '<button class="concept-tab" role="tab" id="jwt-tab-'+i+'" aria-controls="jwt-panel" aria-selected="'+(i===0)+'" tabindex="'+(i===0?0:-1)+'" data-concept="'+i+'">'+t(p.label)+'</button>';})+'</div>'+
      '<section class="concept-panel" id="jwt-panel" role="tabpanel" aria-live="polite"></section></div>'+note(c)+
      '<p class="concept-limits">'+t(c.bullets[1])+' '+t(c.bullets[2])+'</p></div>';
    },
    mount:function(el,s){var parts=s.content.concepts;
      function pick(i){el._conceptIndex=i;el.querySelectorAll('[data-concept]').forEach(function(b,k){b.setAttribute('aria-selected',String(k===i));b.tabIndex=k===i?0:-1;});
        el.querySelector('.concept-panel').setAttribute('aria-labelledby','jwt-tab-'+i);
        el.querySelector('.concept-panel').innerHTML='<h3>'+t(parts[i].label)+'</h3><p>'+t(parts[i].text)+'</p>';
      }
      el._conceptPick=pick;el.addEventListener('click',function(e){var b=e.target.closest('[data-concept]');if(b)pick(+b.dataset.concept);});
      el.querySelector('.concept-tabs').addEventListener('keydown',function(e){if(['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].indexOf(e.key)>=0){var i=e.key==='Home'?0:e.key==='End'?parts.length-1:(el._conceptIndex+(e.key==='ArrowDown'||e.key==='ArrowRight'?1:parts.length-1))%parts.length;pick(i);el.querySelector('[data-concept="'+i+'"]').focus();e.preventDefault();}});
      pick(0);
    },reset:function(el){el._conceptPick(0);el.classList.remove('concept-enter');},
    enter:function(el,s,info){if(!info.instant&&info.from&&info.from.sourceId==='S14'){el.classList.add('concept-enter');}},
    escape:function(el){if(el._conceptIndex){el._conceptPick(0);return true;}return false;}
  };
})();
