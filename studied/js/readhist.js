const escapeCoverLabel = value => String(value).replace(/[&"<>]/g, character => ({
    "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;"
})[character]);

const apBook= (book,i)=>$("#grid").append(el_template(i, book))

const bkName= (name)=>(name.en)?name.en:(name.ru)?name.ru:name.ua
const bkYr = seasons => [...new Set(seasons.map(value => fullYear(parseInt(value, 10))))]
    .sort((a, b) => b - a).join(", ");
 
const el_template = (n, { name, author, sezons, roles, notes, type, cat, id, ids, all, cover, rate })=>`<div class='el${(!all)?' gray':''}'>

${(ids&&ids.gr)?`<div class='gric'><a target='_blank' title="Goodreads card" href='https://www.goodreads.com/book/show/${ids.gr}'><img src='gr.png' width="16" alt="at Goodreads"/></a></div>`:''}

<div class="nn">${n+1}. <span class="mingr">${bkYr(sezons)}</span>
                ${cat=="hu"?'<span class="hud_mark">fic</span> ':''}${type&&type!=="book"?'<span style="background-color:yellow;">'+type+'</span>':''}
</div>

${cover ? `<div style="margin:3px; padding-top: 7px; text-align: center;"><img class="book-cover" src="covers/${encodeURIComponent(id)}.jpeg" width="130" loading="lazy" decoding="async" alt="${escapeCoverLabel(bkName(name) + (author ? " — " + author : ""))}"></div>

    <div class='podCover'><a title="Brave search"  target="_blank" href='${'https://search.brave.com/search?q='+encodeURIComponent((type?type+' ':'')+bkName(name)+(author?' '+author:''))}'>${bkName(name).slice(0,80)}</a></div>`

        : `<div class='insteadCover'><a title="Brave search"  target="_blank" href='${'https://search.brave.com/search?q='+encodeURIComponent('book '+bkName(name)+(author?' '+author:''))}'>${bkName(name)}</a></div> 
                ${(author) ? '<div style="color:green; font-size:0.75em; margin:5px">'+author+'</div>'
                            :''}
            `}

${rate&&rate["my%"]?`<div class='bkrate'><progress title="I enjoyed ${rate["my%"]}%" style="width:100px;" value="${rate["my%"]}" max="100"></progress></div>`:''}
</div>`

//=======================================================

const fullYear = year => year > 30 ? year + 1900 : year + 2000;

function getMeta(books) {
    const result = { c: {}, y: {}, r: {} };
    for (const book of books) {
        if (!book.all) continue;
        if (book.cat) result.c[book.cat] = (result.c[book.cat] || 0) + 1;
        for (const season of new Set(book.sezons.map(value => parseInt(value, 10)))) {
            const year = fullYear(season);
            result.y[year] = (result.y[year] || 0) + 1;
        }
        for (const role of book.roles || []) {
            result.r[role] = (result.r[role] || 0) + 1;
        }
    }
    return result;
}

function renderFilters(categoryMeta, yearMeta, categoryTotal) {
    const focused = document.activeElement;
    const categories = Object.keys(categoryMeta.c).sort((a, b) => categoryMeta.c[b] - categoryMeta.c[a]);
    const years = Object.keys(yearMeta.y).sort((a, b) => b - a);

    $("#cats").empty();
    $("#category-filter").empty().append(new Option("Any category", ""));
    for (const cat of categories) {
        const count = categoryMeta.c[cat];
        const button = $("<button>", {
            type: "button",
            class: "lfftr",
            value: cat,
            title: count + " books",
            text: cats_data[cat]
        }).on("click", () => cat_click(cat));
        $("#cats").append(button);
        if (s.fix !== "c") {
            const percentage = categoryTotal ? Math.round(count / categoryTotal * 100) : 0;
            $("<div>").css({ fontSize: ".7em", color: "#929292" }).text(percentage + "%").appendTo("#cats");
        }
        $("#category-filter").append(new Option(cats_data[cat], cat));
    }

    $("#years").empty();
    $("#year-filter").empty().append(new Option("Any year", ""));
    for (const year of years) {
        const code = year.slice(2);
        const button = $("<button>", {
            type: "button",
            class: "rtftr",
            value: code,
            text: year
        }).on("click", () => yr_click(code));
        $("#years").append(button, $("<div>").css("font-size", ".8em").text(yearMeta.y[year] + " bk"));
        $("#year-filter").append(new Option(year, code));
    }

    // Keep a shared selection visible even if the query leaves its facet empty.
    if (s.cat && !categories.includes(s.cat)) $("#category-filter").append(new Option(cats_data[s.cat], s.cat));
    if (s.yr && !years.includes(String(fullYear(Number(s.yr))))) {
        $("#year-filter").append(new Option(String(fullYear(Number(s.yr))), s.yr));
    }

    $("#category-filter").val(s.cat);
    $("#year-filter").val(s.yr);
    $(".leftfilter").toggleClass("hl", s.fix === "c");
    $(".rightfilter").toggleClass("hl", s.fix === "y");
    $(".lfftr").each(function () {
        $(this).toggleClass("cur_cat", this.value === s.cat).attr("aria-pressed", String(this.value === s.cat));
    });
    $(".rtftr").each(function () {
        $(this).toggleClass("cur_year", this.value === s.yr).attr("aria-pressed", String(this.value === s.yr));
    });
    if (focused?.matches(".lfftr, .rtftr") && !focused.isConnected) {
        const filter = focused.classList.contains("lfftr") ? ".lfftr" : ".rtftr";
        [...document.querySelectorAll(filter)].find(button => button.value === focused.value)?.focus();
    }
}

function redraw({ ch_cat, ch_yr, ch_rl, ch_txt, syncHistory = true, refreshRoleMatches = false } = {}) {
    s.rl = $(".rl_active").map(function () { return this.id; }).get();

    if (ch_cat !== undefined) {
        s.cat = ch_cat;
        if (s.fix === "c" && s.cat) s.yr = "";
    }
    if (ch_yr !== undefined) {
        s.yr = ch_yr;
        if (s.fix === "y" && s.yr) s.cat = "";
    }
    if (ch_rl || ch_txt) {
        s.cat = "";
        s.yr = "";
    }
    if ((!s.fix || s.fix === "c") && !s.cat) s.fix = s.yr ? "y" : "";
    if ((!s.fix || s.fix === "y") && !s.yr) s.fix = s.cat ? "c" : "";

    const base = booksDB.filter(book => {
        const matchesText = !s.q || [book.name.ru, book.name.en, book.name.ua, book.tags, book.author, book.coauthor]
            .some(value => typeof value === "string" && value.toLowerCase().includes(s.q));
        const matchesRole = !s.rl.length || book.roles?.some(role => s.rl.includes(role));
        return matchesText && matchesRole;
    });
    const matchesCategory = book => !s.cat || book.cat === s.cat;
    const matchesYear = book => !s.yr || book.sezons.some(season => parseInt(season, 10) === Number(s.yr));
    const fbooks = base.filter(book => matchesCategory(book) && matchesYear(book));
    const baseMeta = getMeta(base);
    const primaryBooks = s.fix === "c" ? base.filter(matchesCategory)
        : s.fix === "y" ? base.filter(matchesYear) : base;
    const primaryMeta = primaryBooks === base ? baseMeta : getMeta(primaryBooks);
    renderFilters(s.fix === "y" ? primaryMeta : baseMeta, s.fix === "c" ? primaryMeta : baseMeta,
        s.fix === "y" ? primaryBooks.length : base.length);

    if ((ch_txt || refreshRoleMatches) && s.q) {
        $(".roles").each(function () {
            $(this).css("color", baseMeta.r[this.id] ? "" : "#606060");
        });
    }
    if (syncHistory) setURL();

    const categoryName = s.cat ? cats_data[s.cat] : "Any category";
    const yearName = s.yr ? fullYear(Number(s.yr)) : "any year";
    const roleName = s.rl.length === 1 ? $(".rl_active").text() : $(".act_btn").text();
    $("#infos").text(categoryName + " · " + yearName + (roleName ? " · " + roleName : ""));
    $("#main").html(`<div id="srez" style="padding-bottom:20px"><div style="font-size:1.3em; padding-bottom:12px; font-weight: bold"><span style="color: #007272; font-size:1.3em">${fbooks.length}</span> ${fbooks.length === 1 ? "item" : "items"} found</div><div id="grid"></div></div>`)

    const BOOK_CUT = 115

    if (fbooks.length===0)
        $("#grid").append('<h1 style="color: red">No results found</h1>')
    else fbooks.sort((a, b) =>{
        let f = 0
        if (b.rate && a.rate && b.rate["my%"] && a.rate["my%"])
            f = parseInt(b.rate["my%"])-parseInt(a.rate["my%"])
        else if (b.rate && b.rate["my%"])
            f = 1        
        else if (a.rate && a.rate["my%"])
            f = -1
        return b.all-a.all || f  
    }).slice(0,BOOK_CUT).forEach(apBook)

    if (fbooks.length>BOOK_CUT) 
        $("#srez").append(`<div id="netknig"><h2 style="color: gray">${fbooks.length - BOOK_CUT} more items</h2></div>`)

}
