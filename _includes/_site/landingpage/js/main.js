function getPathName() {
    var e = document.location.pathname,
        t = e.split("/");
    return "" == t[t.length - 1] && (e = e.slice(0, -1)), e = e.replace(".html", "")
}
!function(e, t) {
    "function" == typeof define && define.amd ? define("smoothScroll", t(e)) : "object" == typeof exports ? module.exports = t(e) : e.smoothScroll = t(e)
}(window || this, function(b) {
    "use strict";
    function e(e, t, n) {
        if ("[object Object]" === Object.prototype.toString.call(e))
            for (var o in e)
                Object.prototype.hasOwnProperty.call(e, o) && t.call(n, e[o], o, e);
        else
            for (var a = 0, s = e.length; a < s; a++)
                t.call(n, e[a], a, e)
    }
    function O(n, o) {
        var a = {};
        return e(n, function(e, t) {
            a[t] = n[t]
        }), e(o, function(e, t) {
            a[t] = o[t]
        }), a
    }
    function S(e) {
        return Math.max(e.scrollHeight, e.offsetHeight, e.clientHeight)
    }
    var n,
        t,
        C,
        o = {},
        a = !!document.querySelector && !!b.addEventListener,
        j = {
            speed: 500,
            easing: "easeInOutCubic",
            offset: 0,
            updateURL: !0,
            callbackBefore: function() {},
            callbackAfter: function() {}
        };
    o.animateScroll = function(c, l, e) {
        var t,
            i = O(i || j, e || {}),
            n = (t = c ? c.getAttribute("data-options") : null) && "object" == typeof JSON && "function" == typeof JSON.parse ? JSON.parse(t) : {};
        i = O(i, n);
        var u,
            f,
            h,
            o,
            a,
            d = "#" === (l = "#" + function(e) {
                for (var t, n = String(e), o = n.length, a = -1, s = "", r = n.charCodeAt(0); ++a < o;) {
                    if (0 === (t = n.charCodeAt(a)))
                        throw new InvalidCharacterError("Invalid character: the input contains U+0000.");
                    1 <= t && t <= 31 || 127 == t || 0 === a && 48 <= t && t <= 57 || 1 === a && 48 <= t && t <= 57 && 45 === r ? s += "\\" + t.toString(16) + " " : s += 128 <= t || 45 === t || 95 === t || 48 <= t && t <= 57 || 65 <= t && t <= 90 || 97 <= t && t <= 122 ? n.charAt(a) : "\\" + n.charAt(a)
                }
                return s
            }(l.substr(1))) ? document.documentElement : document.querySelector(l),
            p = b.pageYOffset,
            s = null === (C = C || document.querySelector("[data-scroll-header]")) ? 0 : S(C) + C.offsetTop,
            m = function(e, t, n) {
                var o = 0;
                if (e.offsetParent)
                    for (; o += e.offsetTop, e = e.offsetParent;)
                        ;
                return 0 <= (o = o - t - n) ? o : 0
            }(d, s, parseInt(i.offset, 10)),
            g = m - p,
            v = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight),
            y = 0;
        o = l,
        a = i.updateURL,
        history.pushState && (a || "true" === a) && history.pushState(null, null, [b.location.protocol, "//", b.location.host, b.location.pathname, b.location.search, o].join(""));
        function r() {
            var e,
                t,
                n,
                o,
                a,
                s,
                r;
            f = 1 < (f = (y += 16) / parseInt(i.speed, 10)) ? 1 : f,
            h = p + g * (e = i.easing, t = f, "easeInQuad" === e && (n = t * t), "easeOutQuad" === e && (n = t * (2 - t)), "easeInOutQuad" === e && (n = t < .5 ? 2 * t * t : (4 - 2 * t) * t - 1), "easeInCubic" === e && (n = t * t * t), "easeOutCubic" === e && (n = --t * t * t + 1), "easeInOutCubic" === e && (n = t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1), "easeInQuart" === e && (n = t * t * t * t), "easeOutQuart" === e && (n = 1 - --t * t * t * t), "easeInOutQuart" === e && (n = t < .5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t), "easeInQuint" === e && (n = t * t * t * t * t), "easeOutQuint" === e && (n = 1 + --t * t * t * t * t), "easeInOutQuint" === e && (n = t < .5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t), n || t),
            b.scrollTo(0, Math.floor(h)),
            o = h,
            a = m,
            s = u,
            r = b.pageYOffset,
            (o == a || r == a || b.innerHeight + r >= v) && (clearInterval(s), d.focus(), i.callbackAfter(c, l))
        }
        0 === b.pageYOffset && b.scrollTo(0, 0),
        i.callbackBefore(c, l),
        u = setInterval(r, 16)
    };
    function s(e) {
        var t = function(e, t) {
            for (var n = t.charAt(0); e && e !== document; e = e.parentNode)
                if ("." === n) {
                    if (e.classList.contains(t.substr(1)))
                        return e
                } else if ("#" === n) {
                    if (e.id === t.substr(1))
                        return e
                } else if ("[" === n && e.hasAttribute(t.substr(1, t.length - 2)))
                    return e;
            return !1
        }(e.target, "[data-scroll]");
        t && "a" === t.tagName.toLowerCase() && (e.preventDefault(), o.animateScroll(t, t.hash, n))
    }
    function r(e) {
        t = t || setTimeout(function() {
            headerHeight = (t = null) === C ? 0 : S(C) + C.offsetTop
        }, 66)
    }
    return o.destroy = function() {
        n && (document.removeEventListener("click", s, !1), b.removeEventListener("resize", r, !1), C = t = n = null)
    }, o.init = function(e) {
        a && (o.destroy(), n = O(j, e || {}), C = document.querySelector("[data-scroll-header]"), document.addEventListener("click", s, !1), C && b.addEventListener("resize", r, !1))
    }, o
}),
function(i) {
    i.fn.simpleJekyllSearch = function(e) {
        var a = i.extend({
                jsonFile: "/search.json",
                jsonFormat: "title,category,desc,url,date,shortdate",
                template: '<li><article><a href="{url}">{title} <span class="entry-date"><time datetime="{date}">{date}</time></span></a></article></li>',
                searchResults: ".search-results",
                searchResultsTitle: "<h4>Search Results:</h4>",
                limit: "5",
                noResults: "<p>Oh snap!<br/><small>Nothing found! :(</small></p>"
            }, e),
            s = a.jsonFormat.split(","),
            r = [],
            o = this,
            c = i(a.searchResults);
        function l() {
            c.children().remove()
        }
        a.jsonFile.length && c.length && i.ajax({
            type: "GET",
            url: a.jsonFile,
            dataType: "json",
            success: function(e, t, n) {
                r = e,
                o.keyup(function(e) {
                    var t,
                        n,
                        o;
                    i(this).val().length ? (n = i(this).val(), o = [], i.each(r, function(e, t) {
                        for (e = 0; e < s.length; e++)
                            void 0 !== t[s[e]] && -1 !== t[s[e]].toLowerCase().indexOf(n.toLowerCase()) && (o.push(t), e = s.length)
                    }), t = o, l(), c.append(i(a.searchResultsTitle)), t.length ? i.each(t, function(e, t) {
                        if (e < a.limit) {
                            var n = a.template;
                            for (e = 0; e < s.length; e++) {
                                var o = new RegExp("{" + s[e] + "}", "g");
                                n = n.replace(o, t[s[e]])
                            }
                            c.append(i(n))
                        }
                    }) : c.append(a.noResults)) : l()
                })
            },
            error: function(e, t, n) {
                console.log("***ERROR in simpleJekyllSearch.js***"),
                console.log(e),
                console.log(t),
                console.log(n)
            }
        })
    }
}(Zepto),
function(e) {
    e("a#slide").click(function() {
        e("#sidebar,a#slide,#fade").addClass("slide"),
        e("#open").hide(),
        e("#search").hide(),
        e("#close").show()
    }),
    e("#fade").click(function() {
        e("#sidebar,a#slide,#fade").removeClass("slide"),
        e("#open").show(),
        e("#search").show(),
        e("#close").hide()
    });
    var t = {
        close: e(".icon-remove-sign"),
        searchform: e(".search-form"),
        canvas: e("body"),
        dothis: e(".dosearch")
    };
    t.dothis.on("click", function() {
        e(".search-wrapper").toggleClass("active"),
        t.searchform.toggleClass("active"),
        t.searchform.find("input").focus(),
        t.canvas.toggleClass("search-overlay"),
        e(".search-field").simpleJekyllSearch()
    }),
    t.close.on("click", function() {
        e(".search-wrapper").toggleClass("active"),
        t.searchform.toggleClass("active"),
        t.canvas.removeClass("search-overlay")
    }),
    smoothScroll.init({
        updateURL: !1
    })
}(Zepto, window);
