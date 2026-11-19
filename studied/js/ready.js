const s = { rl: [], cat: "", yr: "", q: "", fix: "" };

const cat_click = ch_cat => redraw({ ch_cat });
const yr_click = ch_yr => redraw({ ch_yr });

function clearRoles() {
    $("#filter button").removeClass("rl_active act_btn").attr("aria-pressed", "false");
    $("#filter .roles").css("color", "");
}

function restoreFilters() {
    const params = new URLSearchParams(location.search);
    const category = params.get("cat");
    const year = params.get("yr") || "";
    const query = params.get("q") || "";

    s.cat = Object.hasOwn(cats_data, category)
        ? category
        : Object.keys(cats_data).find(key => cats_data[key] === category) || "";
    s.yr = /^\d{1,2}$/.test(year) ? year.padStart(2, "0") : "";
    s.q = query.trim().toLowerCase();
    s.fix = params.get("a") === "y" && s.yr ? "y" : s.cat ? "c" : s.yr ? "y" : "";

    clearRoles();
    $("#flt_txt").val(query);
    redraw({ syncHistory: false, refreshRoleMatches: Boolean(s.q) });
}

function setURL() {
    const url = new URL(location.href);
    const filters = { q: $("#flt_txt").val().trim(), yr: s.yr, a: s.fix, cat: s.cat };
    for (const [name, value] of Object.entries(filters)) {
        if (value) url.searchParams.set(name, value);
        else url.searchParams.delete(name);
    }
    if (url.href !== location.href) history.pushState(null, "", url);
}

function buildRoles() {
    for (const [root, name] of Object.entries(roles_names)) {
        const row = $("<div>").css({
            backgroundColor: roles_colors[root],
            padding: "6px 12px",
            textAlign: "right"
        });

        for (const [id, [label, description]] of Object.entries(roles[root])) {
            const button = $("<button>", {
                type: "button",
                class: "roles",
                id,
                title: description || "",
                "aria-pressed": "false",
                text: label
            }).on("click", () => {
                clearRoles();
                button.addClass("rl_active").attr("aria-pressed", "true");
                redraw({ ch_rl: true });
            });
            row.append(button, " ");
        }

        const group = $("<button>", {
            type: "button",
            class: "rl_btn",
            "aria-pressed": "false",
            text: name
        }).on("click", () => {
            clearRoles();
            row.find(".roles").addClass("rl_active").attr("aria-pressed", "true");
            group.addClass("act_btn").attr("aria-pressed", "true");
            redraw({ ch_rl: true });
        });
        row.append(group);
        $("#filter").append(row);
    }
}

$(function () {
    buildRoles();
    restoreFilters();
    window.addEventListener("popstate", restoreFilters);
    $("#category-filter").on("change", event => cat_click(event.target.value));
    $("#year-filter").on("change", event => yr_click(event.target.value));

    $("#find").on("submit", event => {
        event.preventDefault();
        s.q = $("#flt_txt").val().trim().toLowerCase();
        clearRoles();
        redraw({ ch_txt: true });
    });
    $("#reset_btn").on("click", () => {
        clearRoles();
        $("#flt_txt").val("");
        Object.assign(s, { cat: "", yr: "", q: "", fix: "" });
        redraw();
    });

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        if (event.target.id === "flt_txt") {
            $("#flt_txt").val("");
            s.q = "";
            clearRoles();
            redraw();
        } else {
            location.href = "../";
        }
    });
    window.addEventListener("scroll", () => {
        const pageHeight = document.documentElement.scrollHeight;
        $("#scrllbtn").toggle(window.scrollY > pageHeight * .7);
    }, { passive: true });
});

function topFunction() {
    window.scrollTo(0, 0);
}
