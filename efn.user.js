// ==UserScript==
// @name        Extended Field Notes
// @description	Makes field notes usable in other places: shows already found caches from there in your statistics, and changes the display of caches in bookmark lists as if they were already logged as found.
// @author		Jakob Mayer <mail@jakobmayer.at>
// @namespace   http://www.jakobmayer.at/gc/spf.user.js
// @include     https://www.geocaching.com/my/statistics.aspx
// @include     http://www.geocaching.com/my/statistics.aspx
// @include     https://www.geocaching.com/bookmarks/*
// @include     http://www.geocaching.com/bookmarks/*
// @version     1.1
// @require		https://ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min.js
// @grant       none
// @grant		GM_xmlhttpRequest
// ==/UserScript==

$(function(){
    console.log("stat+field v 0.1");
    var	fieldnotes, found = [],
        logRowSel = ".Table tbody tr",
        bmReg = /\/bookmarks\/.*\.aspx$/, bmCase,
        stReg = /\/statistics\.aspx$/, stCase,
        gcCodeReg = /\/geocache\/(.+)_/,
        path = window.location.pathname;

    // Boolean extension functions
    var bf = (function() {
        function any() {
            for (var b of arguments) {
                if (b) return true;
            }
            return false;
        }
        function all() {
            for (var b of arguments) {
                if (!b) return false;
            }
            return true;
        }
        return {
            any: any,
            all: all,
            none: (...a) => !any(...a),
            notall: (...a) => !all(...a),
        };
    })();

    $.extend(Boolean, bf);

    function defVal(cond, val) {
        return !cond ? val : cond;
    }

    function inc(a, i) {
        a[i] = defVal(a[i],0) + 1;
    }

    function isOnPath() {
        return Boolean.any(
            bmCase = bmReg.test(path),
            stCase = stReg.test(path),
            undefined
        );
    }

    function handle() {
        if (bmCase) {
            bmHandle();
        } else if (stCase) {
            stHandle();
        }
    }

    function stHandle() {
        var dates = {},
            months = [undefined ,"January","February","March","April","May","June","July","August","September","October","November","December"]; // begin index 1

        $.each(found,function(i,tr){
            var tr_date = $("td:eq(2)", tr).text().split(" ");
            var day = Number(tr_date[0]),
                month = months.indexOf(tr_date[1]);
            var id = month+"_"+day;

            inc(dates,id);
        });

        $.each(dates,function(i,f){
            var $id = $("#"+i);
            var m = Number($id.text());
            $id.text(m + f);
            $id.css({"background-color":"#f88","color":"#fff"});
        });
    }

    function gcCode(url, callback) {
        // need XHR for responseURL
        var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, true);
            xhr.onload = function () {
                var code = gcCodeReg.exec(xhr.responseURL)[1];
                callback(code);
            };
            xhr.send(null);
    }

    function bmHandle() {
        $.each(found, function(i,tr) {
            var url = $("td:eq(1) a",tr).attr("href");

            gcCode(url, function(code){
                var row  = $(logRowSel + ":contains(" + code + ")"),
                    row2 = $("#" + row.attr("id") + "2");

                row.add(row2).addClass("TertiaryRow");
                $("td:eq(2)", row).html('<img src="/images/icons/16/found.png" alt="X" title="List Owner Found It!">');
            });
        });
    }

    function isLogType(lt, tr) {
        var log = $("td:eq(3):contains("+lt+")", tr);
        return log.length && log.length > 0;
    }

    if (isOnPath()) {
        $.get("//www.geocaching.com/my/fieldnotes.aspx")
            .done(function(val) {
            fieldnotes = $(logRowSel, $.parseHTML(val));

            fieldnotes.each(function(i,tr){
                if(isLogType("Found it"), tr) {
                    found.push(tr);
                }
            });

            handle(path);
        });

    }
});