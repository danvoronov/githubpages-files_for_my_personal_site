
booksDB.forEach(e=>{
    if (e.cover) e.cover = true;
    return e
})

for (root in roles) {
    let t = ''
    for (rl in roles[root]) t += `<div class="flt"><input type="checkbox" class="label-for-check" id="${rl}" name="${rl}" value="${rl}"> <label class="label-for-check" for="${rl}" title="${(roles[root][rl][1])?roles[root][rl][1]:''}">${roles[root][rl][0]}</label></div>`
    $("#allroles").append(`<div style="text-align:center; align-self: flex-end"><div class="rl_col">${t}</div><b>${roles_names[root]}</b></div>`)
}
// ===============================================

const name = (b)=>`#${b.ids.ai+1} <i>${b.type}</i> — ${b.all?'':'<span style="color: gray;">'} <b>${(b.name.ru)?b.name.ru:(b.name.en)?b.name.en:JSON.stringify(b.name)}</b>${(b.author)?'<br/>'+b.author:''}${b.all?'':'</span>'}`

function updateList(i) {
    $("#curcat").html(booksDB[i].cat.toUpperCase())
    $('input:checkbox').prop('checked', '');
    if(booksDB[i].roles) booksDB[i].roles.forEach(role_id =>$("#"+role_id).prop('checked', 'checked'))
    let db_bt = booksDB[i].dub?'<b>ДУБЛИКАТ</b>':`<button onClick="applay_dub()">❌ ДУБЛИКАТ</button>`
    $("#current").html(`${db_bt} &nbsp;${name(booksDB[i])}`).css('background-color',catcl[booksDB[i].cat])
    $("#here").html('<ul style="padding-bottom: 35px"></ul>')
    $("#toend").html('> <b>'+(booksDB.length-i)+"</b>")
    $("#here ul").append(booksDB.slice(i,i+16).reduce((acc,el,i)=>acc+`<li>${name(el)}</li>`, ''))
    return 1
}

updateList(cur)

// ==============================================================================
$(document).keyup(function(e){            
    if(e.key === "ArrowLeft")  $("#prev_book").click()
    if(e.key === "ArrowRight") $("#next_book").click()     
});
$("#next_book").click(function (argument) { if(cur==booksDB.length-1) return
    booksDB[cur].roles = $(".rl_col input:checkbox:checked").map(function(){ return $(this).val() }).get()
    // console.log(booksDB[cur].roles) 
    updateList(++cur)
})      
$("#prev_book").click(function (argument) { if(cur==0) return
    booksDB[cur].roles = $(".rl_col input:checkbox:checked").map(function(){ return $(this).val() }).get()
    // console.log(booksDB[cur].roles) 
    updateList(--cur)
})    
function applay_dub(){ booksDB[cur].dub = true; updateList(++cur) }

// ==============================================================================

function saveJSON2file(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}    
$("#save").click(a=> saveJSON2file(`var booksDB = `+JSON.stringify(booksDB, null, 4), 'data.js', 'text/javascript'))