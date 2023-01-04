var thisurl;

var s = {
    rl: [],
    cat: "",
    yr: "",
    q: "",
    fix: ""
}

const cat_click = ch_cat => redraw({ch_cat}) 
const yr_click = ch_yr => redraw({ch_yr}) 

function init(url_yr, url_cat, url_q, url_fix) {

    let c = Object.keys(cats_data).filter(k=>cats_data[k]===url_cat); 
    s.cat = c[0]?c[0]:''
    s.yr = url_yr?url_yr:''
    s.q = url_q?url_q:''
    if (url_q) { $("#flt_txt").val(url_q); return redraw({ch_txt:true}) }
    
    if (url_fix=='c') return redraw({ch_cat: s.cat})
    if (url_fix=='y') return redraw({ch_yr:  s.yr })

    redraw()  
    
}


function roli_upd() {
    $('.roles').removeClass('rl_active')
    $(".rl_btn").removeClass('act_btn')
    $(this).addClass('act_btn')
    $('.cl_'+$(this).attr('data')).addClass('rl_active')
    redraw({ch_rl:true}) 
}
function filter_books_by_role(el) {
    $('.roles').removeClass('rl_active')
    $(".rl_btn").removeClass('act_btn')
    $(el).addClass('rl_active')
    redraw({ch_rl:true}) 
}

$(document).ready(async ()=>{   thisurl = new URL(location.toString()); 

    for (root in roles_names){
        let txt=`<div id="raw${root}" style="background-color: ${roles_colors[root]}; padding: 6px 12px; text-align: right">`
        for (rl in roles[root]) txt+=` <span class="roles cl_${root}" id="${rl}" value="${rl}" onClick="filter_books_by_role(this)" title="${(roles[root][rl][1])?roles[root][rl][1]:''}">${roles[root][rl][0]}</span>`
        $("#filter").append(txt+` &nbsp; <button class='rl_btn' data='${root}'>${roles_names[root]}</button></div>`) 
    }    

    init(getprm('yr'), getprm('cat'), getprm('q'), getprm('a')) 

    $(".rl_btn").click(roli_upd);
    $("#reset_btn").click(()=>{ 
        $('.roles').css("color","").removeClass('rl_active')
        $(".rl_btn").removeClass('act_btn')
        $("#flt_txt").val(''); 
        s.fix=''; s.cat=''; s.rl=[]; s.yr=''; s.q=''
        redraw() 
    }); 

    document.onkeydown = (event) => {
        
        let keyCode = event.keyCode ? event.keyCode : event.which
        if(keyCode == '27') {
            event.preventDefault();
            window.location.href = '../../'; //two level up
        }
        
        // if(e.key === "ArrowLeft") $("#prev").click()
        // if(e.key === "ArrowRight") $("#next").click()    
    };

    $('#flt_txt').keyup(function(e){    
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code !== 13 && code !== 27) return  // 13 энтер 27 эскейп
        e.preventDefault();
    
        if (code === 27) $("#flt_txt").val('')
        s.q = $("#flt_txt").val().toLowerCase().trim()
        $(".roles").css("color","").removeClass('rl_active')
        $(".rl_btn").removeClass('act_btn')
        redraw(s.q==''?{}:{ch_txt:true}) 
    });


 
})

const getprm = name=> decodeURIComponent((new RegExp('[?|&]'+name+'=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;

function setURL() {
    var search_params = new URLSearchParams();

    if($("#flt_txt").val()!='') search_params.set('q', $("#flt_txt").val());
    if(s.yr) search_params.set('yr', +s.yr);
    if(s.fix) search_params.set('a', s.fix);
    if(s.cat && cats_data[s.cat]) search_params.set('cat', s.cat );

    thisurl.search = search_params.toString();
    window.history.pushState('s','DanBooks', thisurl.toString());
}


// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};
var body = document.body,
    html = document.documentElement,
    mybutton = document.getElementById("scrllbtn");

var DOCheight = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );

function scrollFunction() {
  if (body.scrollTop >  DOCheight*.7 || html.scrollTop > DOCheight*.7) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() { body.scrollTop = 0; html.scrollTop = 0; } 