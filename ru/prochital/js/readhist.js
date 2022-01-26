const loadImage = function(iname){    
    var jpeg_image = './covers/' + iname + '.jpeg';
    var png_image = './covers/' + iname + '.png';  
    var imageP = new Image(), imageJ = new Image();
    imageJ.onload = ()=> { if (imageJ.width>0) $("#img_"+iname).attr('src', jpeg_image) };
    imageJ.src = jpeg_image;
    imageP.onload = ()=>{ if (imageP.width>0) $("#img_"+iname).attr('src', png_image) };
    imageP.src = png_image;
    return '';
 }

const apBook= (book,i)=>$("#grid").append(el_template(i, book))

const bkName= (name)=>(name.ru)?name.ru:(name.en)?name.en:name.ua
const bkYr= (sz)=>sz.map(yt=>parseInt(yt)).filter((v, i, a)=>a.indexOf(v)===i).map(y=>y>30?y+1900:y+2000).sort().reverse().join(', ');
 
// ${rate&&rate["my%"]?`<span class="mingr">${rate["my%"]}%</span>  `:''}
// $('.cur_year').attr('value')!='0'?
// МОЯ ЗАМЕТКА ?? линки на поиск в библиоткеке
const el_template = (n, { name, author, sezons, roles, type, cat, ids, all, cover_url, rate })=>`<div class='el${(!all)?' gray':''}'>

${(ids&&ids.gr)?`<div class='gric'><a target='_blank' href='https://www.goodreads.com/book/show/${ids.gr}'><img src='data/gr.png' width="16" alt="at Goodreads"/></a></div>`:''}

<div class="nn">${n+1}.<span class="mingr">${bkYr(sezons)}</span>
                ${(cat && $('.cur_cat').attr('cat')==='all' && cat!='худла')?'<span class="cattag">'+cat.slice(0,10)+'</span> ':''}${cat=="худла"?'<span class="hud_mark">худ</span> ':''}${type!=="книга"?'<span style="background-color:yellow;">'+type+'</span>':''}
</div>

${cover_url ? `<div style="margin:3px; padding-top: 7px; text-align: center;"><img id="img_${ids.art}" src="${loadImage(ids.art)}" width="130" alt="${bkName(name)}${author?'  —  '+author:''}" title="${bkName(name)}${author?'  —  '+author:''}"></div>

    <div class='podCover'><a target="_blank" href='${'https://search.brave.com/search?q='+encodeURIComponent('книга '+bkName(name)+(author?' '+author:''))}'>${bkName(name).slice(0,80)}</a></div>`

            : `<div class='insteadCover' onClick='console.log("${ids.art}")'>${bkName(name)}</div> 
                ${(author) ? '<div style="color:green; font-size:0.75em; margin:5px">'+author+'</div>'
                            :''}
            `}

${rate&&rate["my%"]?`<div class='bkrate'><progress title="${rate["my%"]}%" style="width:100px;" value="${rate["my%"]}" max="105"></progress>`:''}
</div>`

//=======================================================

const getMeta = db => db.reduce((acc,e)=>{
        if (!e.all) return acc 
        acc.c[e.cat] = acc.c[e.cat]?acc.c[e.cat]+1:1
        let yrs = e.sezons.map(yt=>parseInt(yt)).filter((v, i, a)=>a.indexOf(v)===i).map(y=>y>30?y+1900:y+2000);
        for (i in yrs)
            acc.y[yrs[i]] = acc.y[yrs[i]]?acc.y[yrs[i]]+1:1        
        for (i in e.roles)
            acc.r[e.roles[i]] = acc.r[e.roles[i]]?acc.r[e.roles[i]]+1:1
        return acc 
    },{c:{}, y:{}, r:{}})



// ==============================================================
//        ГЛАВНАЯ РИСОВАШКА ДАНННЫХ
// ==============================================================
function redraw({ch_cat, ch_yr, ch_rl, ch_txt}={}) { 

    $(".disa").prop("disabled",true).css('color', 'lightgray');
    $(".disa").removeClass('hl')
    $('.lfftr').removeClass('cur_cat')
    $('.rtftr').removeClass('cur_year')

    s.rl = typeof ch_txt != 'undefined'?[]:$('.rl_active').map(function(){ return $(this).attr('id');}).get()

    if (typeof ch_cat != 'undefined') s.cat = ch_cat;
    if (typeof ch_yr != 'undefined') s.yr = ch_yr; 
    if (typeof ch_rl != 'undefined' || typeof ch_txt != 'undefined') {
        s.fix=''; s.cat=''; s.yr=''
    } 

    switch (s.fix) {
      case '' : s.fix= ch_cat?'c':(ch_yr?'y':''); break;
      case 'c': if (s.cat=='') s.fix = ((s.yr) ?'y':''); else if (ch_cat) s.yr=''; break;
      case 'y': if (s.yr=='')  s.fix = ((s.cat)?'c':''); else if (ch_yr) s.cat=''; break;
    }
    
// когда перепрос на сторону - неправильный бейс

    const base = booksDB.filter(fl=>{
        const is_q = ((s.q=='') || (fl.name && fl.name.ru && fl.name.ru.toLowerCase().includes(s.q)) || (fl.name && fl.name.en && fl.name.en.toLowerCase().includes(s.q)) || (fl.tags && fl.tags.toLowerCase().includes(s.q)) || (fl.author && fl.author.toLowerCase().includes(s.q)) || (fl.coauthor && fl.coauthor.toLowerCase().includes(s.q)) ),
            is_role = (s.rl.length==0 || (fl.roles&&fl.roles.some(rl=>s.rl.includes(rl))))
        return (is_q&&is_role) 
    }),
        fbooks = base.filter(fl=>(s.yr=='' || fl.sezons.some((sz) => parseInt(sz)===+s.yr) ) && (s.cat=='' || fl.cat===s.cat))

    const base_meta = getMeta(base), meta = getMeta(fbooks)

    if (typeof ch_txt != 'undefined'){
        $(".roles").css("color","lightgray")
        Object.keys(base_meta.r).forEach(r=>$(`.roles[value='${r}']`).css("color",""))    
    }

    const ap_cat = m => $("#cats").html(Object.keys(m.c).sort((a,b)=>m.c[b]-m.c[a]).reduce((h,k)=> (k=='остальное')?h:h+`<div class="lfftr" ${ch_cat?'':`title="${m.c[k]} шт"`} onClick='cat_click("${k}")' value="${cats_data[k].val}">${cats_data[k].name}</div>`+(s.fix=='c'?'':`<div style='font-size:0.7em; color: #595959;'>${Math.round(m.c[k]/fbooks.length*100)} %</div>`),''))    
    
    const ap_yr = m => {
        let ks = Object.keys(m.y).sort((a,b)=>b-a),
        vl = ks.map(i=>m.y[i]),
        mx = Math.max( ...vl), mn = Math.min( ...vl)
        $("#years").html(ks.reduce((h,y)=> h+`<div class="rtftr" style='font-size:${85+(m.y[y]-mn)/(mx-mn)*50}%'  onClick='yr_click("${y.slice(2)}")' value="${y.slice(2)}">${y}</div><div style='font-size:0.8em; color: #595959;'>${m.y[y]} шт</div>`,''))  
    }
    
    switch (s.fix) {
      case '':
        ap_cat(base_meta)
        ap_yr(base_meta)
        break;      
      case 'c':
        ap_cat(base_meta)
        if (ch_cat) ap_yr(meta)
        $(".leftfilter").addClass('hl')
        break;
      case 'y':
        ap_yr(base_meta)
        if (ch_yr) ap_cat(meta)
        $(".rightfilter").addClass('hl')
        break;
    }
 
    setURL();
    
    $('div.lfftr[value="'+(s.cat&&cats_data[s.cat]?cats_data[s.cat].val:'')+'"]').addClass("cur_cat"); $('div.rtftr[value="'+(s.yr?s.yr:'')+'"]').addClass("cur_year");


    let rnm = s.rl.length==0?'':(s.rl.length>1?'<span class="mininf">Круг:</span> '+Object.keys(roles_names).reduce((a,k)=>{ a[k[0]] = roles_names[k]; return a },{})[s.rl[0][0]]:'<span class="mininf">Роль:</span> '+Object.values(roles).reduce((a,e)=>({...e,...a}),{})[s.rl[0]][0])+'.'
    $("#infos").html(`${$('.cur_cat').text()} &nbsp;<span class="mininf">за</span>&nbsp;  ${$('.cur_year').text()} &nbsp;<span class="mininf">год.</span>&nbsp;  ${rnm}`)
    $("#main").html(`<div id="srez" style="padding-bottom:20px"><div style="font-size:1.3em; padding-bottom:12px; font-weight: bold">Всего <span style="color: #007272; font-size:1.3em">${fbooks.length}</span> книг:</div><div id="grid"></div></div>`)

    const sez_nm =  ['з','в','л','о'] // b.score-a.score || b.fresh-a.fresh 

    if (fbooks.length===0)
        $("#grid").append('<h1 style="color: red">Ничего не найдено!</h1>')
    else fbooks.sort((a, b) =>{
        let f = 0
        if (b.rate && a.rate && b.rate["my%"] && a.rate["my%"])
            f = parseInt(b.rate["my%"])-parseInt(a.rate["my%"])
        else if (b.rate && b.rate["my%"])
            f = 1        
        else if (a.rate && a.rate["my%"])
            f = -1
        return b.all-a.all || f  
    }).slice(0,100).forEach(apBook)

    if (fbooks.length>100) 
        $("#srez").append(`<div id="netknig"><h2 style="color: gray">ОБРЕЗАЛИ ${fbooks.length-100} книг</h2></div>`)

    DOCheight = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );

    $(".disa").prop("disabled",false).css('color', '');

}