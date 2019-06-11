//动态脚本库
(function (config) {
    (function (a, b) {
        function c(a, m) {
            var c = b.createElement("script");
            c.charset = "utf-8";
            c.src = a;
            c.type = "text/javascript";
            if (m !== undefined) c.setAttribute("data-main", m);
            (a = h || k) && a.appendChild(c);
            return c;
        }

        function d() {
            var a = [config[0] + config[1][0], config[0] + config[1][1], config[0] + config[1][2]];
            var b = c(a[0]);
            b.onload = b.onreadystatechange = function () {
                if (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete') {
                    var m = (c(a[1], a[2]));
                    m.onload = m.onreadystatechange = function () {
                        window.mUrl = "model";
                        m.onload = m.onreadystatechange = null;
                    };
                    b.onload = b.onreadystatechange = null;
                }
            };
        }

        var h = b.head || b.getElementsByTagName("head")[0], k = b.body || b.getElementsByTagName("body")[0];
        d();
    })(window, document);
})(["http://192.168.2.235:80/api/public", ["/build/view.js", "/build/require.js", "/index/main.js"]]);            //局域网服务器
// })(["http://192.168.2.204:1113/public", ["/build/view.js", "/build/require.js", "/index/main.js"]]);
