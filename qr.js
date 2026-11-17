/*
 * 간단한 QR 코드 생성기 (외부 라이브러리 없음, 이 사이트 전용).
 * - 입력은 UTF-8 바이트 모드, 버전 1~10, 오류 정정 수준 L 또는 M.
 * - 짧은 주소(URL)를 확인서·안내문에 넣는 용도입니다. 긴 글은 지원하지 않습니다.
 * - 모든 계산은 브라우저 안에서만 이뤄지고 어디로도 전송되지 않습니다.
 *
 * 사용:
 *   const svg = ItsvcQR.svg("https://example.com/", { ecc: "M", margin: 4 }); // SVG 문자열
 *   const qr = ItsvcQR.create("https://example.com/"); // { size, version, get(x, y) }
 */
(function (root) {
  "use strict";

  // GF(256), 원시 다항식 0x11D
  var EXP = new Uint8Array(512);
  var LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 256) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }

  function rsGenerator(degree) {
    var g = [1];
    for (var i = 0; i < degree; i++) {
      var next = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) {
        next[j] ^= g[j];
        next[j + 1] ^= mul(g[j], EXP[i]);
      }
      g = next;
    }
    return g;
  }

  function rsRemainder(data, gen) {
    var degree = gen.length - 1;
    var result = new Array(degree).fill(0);
    for (var k = 0; k < data.length; k++) {
      var factor = data[k] ^ result.shift();
      result.push(0);
      for (var i = 0; i < degree; i++) result[i] ^= mul(gen[i + 1], factor);
    }
    return result;
  }

  // 버전별 [블록당 오류정정 코드워드 수, [[블록 수, 블록당 데이터 코드워드 수], ...]]
  var EC_TABLE = {
    L: [null, [7, [[1, 19]]], [10, [[1, 34]]], [15, [[1, 55]]], [20, [[1, 80]]], [26, [[1, 108]]],
      [18, [[2, 68]]], [20, [[2, 78]]], [24, [[2, 97]]], [30, [[2, 116]]], [18, [[2, 68], [2, 69]]]],
    M: [null, [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]],
      [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]]]
  };
  var FORMAT_BITS = { L: 1, M: 0 };
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  var MAX_VERSION = 10;

  function utf8Bytes(text) {
    if (typeof TextEncoder !== "undefined") return Array.prototype.slice.call(new TextEncoder().encode(text));
    var s = unescape(encodeURIComponent(text));
    var out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function dataCodewords(version, ecc) {
    var blocks = EC_TABLE[ecc][version][1];
    var total = 0;
    blocks.forEach(function (b) { total += b[0] * b[1]; });
    return total;
  }

  function buildDataBits(bytes, version, ecc) {
    var bits = [];
    function push(value, count) {
      for (var i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    }
    push(4, 4); // 바이트 모드
    push(bytes.length, version <= 9 ? 8 : 16);
    bytes.forEach(function (b) { push(b, 8); });
    var capacityBits = dataCodewords(version, ecc) * 8;
    push(0, Math.min(4, capacityBits - bits.length));
    while (bits.length % 8) bits.push(0);
    for (var pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) push(pad, 8);
    var out = [];
    for (var i = 0; i < bits.length; i += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
      out.push(v);
    }
    return out;
  }

  function addEccAndInterleave(data, version, ecc) {
    var info = EC_TABLE[ecc][version];
    var eccLen = info[0];
    var gen = rsGenerator(eccLen);
    var blocks = [];
    var pos = 0;
    info[1].forEach(function (group) {
      for (var i = 0; i < group[0]; i++) {
        var chunk = data.slice(pos, pos + group[1]);
        pos += group[1];
        blocks.push({ data: chunk, ecc: rsRemainder(chunk, gen) });
      }
    });
    var result = [];
    var maxData = Math.max.apply(null, blocks.map(function (b) { return b.data.length; }));
    for (var i = 0; i < maxData; i++) blocks.forEach(function (b) { if (i < b.data.length) result.push(b.data[i]); });
    for (var k = 0; k < eccLen; k++) blocks.forEach(function (b) { result.push(b.ecc[k]); });
    return result;
  }

  function getBit(x, i) { return ((x >>> i) & 1) !== 0; }

  function buildMatrix(codewords, version, ecc) {
    var size = version * 4 + 17;
    var modules = [];
    var isFunc = [];
    for (var r = 0; r < size; r++) {
      modules.push(new Array(size).fill(false));
      isFunc.push(new Array(size).fill(false));
    }
    function setFunc(x, y, dark) {
      modules[y][x] = dark;
      isFunc[y][x] = true;
    }

    function drawFinder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) {
        for (var dx = -4; dx <= 4; dx++) {
          var dist = Math.max(Math.abs(dx), Math.abs(dy));
          var xx = cx + dx, yy = cy + dy;
          if (xx >= 0 && xx < size && yy >= 0 && yy < size) setFunc(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
    function drawAlignment(cx, cy) {
      for (var dy = -2; dy <= 2; dy++) {
        for (var dx = -2; dx <= 2; dx++) setFunc(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    function drawFormat(mask) {
      var data = (FORMAT_BITS[ecc] << 3) | mask;
      var rem = data;
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = ((data << 10) | rem) ^ 0x5412;
      for (var a = 0; a <= 5; a++) setFunc(8, a, getBit(bits, a));
      setFunc(8, 7, getBit(bits, 6));
      setFunc(8, 8, getBit(bits, 7));
      setFunc(7, 8, getBit(bits, 8));
      for (var b = 9; b < 15; b++) setFunc(14 - b, 8, getBit(bits, b));
      for (var c = 0; c < 8; c++) setFunc(size - 1 - c, 8, getBit(bits, c));
      for (var d = 8; d < 15; d++) setFunc(8, size - 15 + d, getBit(bits, d));
      setFunc(8, size - 8, true);
    }
    function drawVersion() {
      if (version < 7) return;
      var rem = version;
      for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      var bits = (version << 12) | rem;
      for (var k = 0; k < 18; k++) {
        var color = getBit(bits, k);
        var a = size - 11 + (k % 3);
        var b = Math.floor(k / 3);
        setFunc(a, b, color);
        setFunc(b, a, color);
      }
    }

    // 타이밍 → 위치 찾기 → 정렬 패턴 → 형식·버전 정보 순서
    for (var t = 0; t < size; t++) {
      setFunc(6, t, t % 2 === 0);
      setFunc(t, 6, t % 2 === 0);
    }
    drawFinder(3, 3);
    drawFinder(size - 4, 3);
    drawFinder(3, size - 4);
    var pos = ALIGN[version];
    var last = pos.length - 1;
    for (var i = 0; i < pos.length; i++) {
      for (var j = 0; j < pos.length; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
        drawAlignment(pos[i], pos[j]);
      }
    }
    drawFormat(0);
    drawVersion();

    // 데이터 배치 (지그재그)
    var bitIndex = 0;
    var totalBits = codewords.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var jx = 0; jx < 2; jx++) {
          var x = right - jx;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? size - 1 - vert : vert;
          if (!isFunc[y][x] && bitIndex < totalBits) {
            modules[y][x] = getBit(codewords[bitIndex >>> 3], 7 - (bitIndex & 7));
            bitIndex++;
          }
        }
      }
    }

    function applyMask(mask) {
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          var invert;
          switch (mask) {
            case 0: invert = (x + y) % 2 === 0; break;
            case 1: invert = y % 2 === 0; break;
            case 2: invert = x % 3 === 0; break;
            case 3: invert = (x + y) % 3 === 0; break;
            case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
            case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
            case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
            default: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          }
          if (!isFunc[y][x] && invert) modules[y][x] = !modules[y][x];
        }
      }
    }

    function penalty() {
      var score = 0;
      var x, y, run, color;
      // 규칙 1: 같은 색 5칸 이상 연속, 규칙 3: 1:1:3:1:1 비율 패턴
      var patA = "10111010000", patB = "00001011101";
      for (var dir = 0; dir < 2; dir++) {
        for (var a = 0; a < size; a++) {
          run = 0; color = null;
          var line = "";
          for (var b = 0; b < size; b++) {
            var m = dir === 0 ? modules[a][b] : modules[b][a];
            line += m ? "1" : "0";
            if (m === color) {
              run++;
              if (run === 5) score += 3; else if (run > 5) score++;
            } else { color = m; run = 1; }
          }
          for (var s = 0; s + 11 <= line.length; s++) {
            var seg = line.substr(s, 11);
            if (seg === patA || seg === patB) score += 40;
          }
        }
      }
      // 규칙 2: 2×2 같은 색 블록
      for (y = 0; y < size - 1; y++) {
        for (x = 0; x < size - 1; x++) {
          var c = modules[y][x];
          if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
        }
      }
      // 규칙 4: 어두운 칸 비율
      var dark = 0;
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (modules[y][x]) dark++;
      var total = size * size;
      score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return score;
    }

    var bestMask = 0, bestScore = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      applyMask(mask);
      drawFormat(mask);
      var p = penalty();
      if (p < bestScore) { bestScore = p; bestMask = mask; }
      applyMask(mask); // XOR이므로 한 번 더 적용하면 원래대로
    }
    applyMask(bestMask);
    drawFormat(bestMask);
    return { size: size, modules: modules };
  }

  function create(text, ecc) {
    ecc = ecc === "L" ? "L" : "M";
    var bytes = utf8Bytes(String(text));
    var version = 0;
    for (var v = 1; v <= MAX_VERSION; v++) {
      var need = 4 + (v <= 9 ? 8 : 16) + bytes.length * 8;
      if (need <= dataCodewords(v, ecc) * 8) { version = v; break; }
    }
    if (!version) throw new Error("QR 코드로 만들기에는 내용이 너무 깁니다(최대 약 " + (dataCodewords(MAX_VERSION, ecc) - 3) + "바이트).");
    var data = buildDataBits(bytes, version, ecc);
    var matrix = buildMatrix(addEccAndInterleave(data, version, ecc), version, ecc);
    return {
      size: matrix.size,
      version: version,
      get: function (x, y) { return x >= 0 && y >= 0 && x < matrix.size && y < matrix.size && matrix.modules[y][x]; }
    };
  }

  function svg(text, options) {
    options = options || {};
    var qr = create(text, options.ecc);
    var margin = options.margin == null ? 4 : options.margin;
    var dark = options.dark || "#000";
    var light = options.light || "#fff";
    var dim = qr.size + margin * 2;
    var path = "";
    for (var y = 0; y < qr.size; y++) {
      var x = 0;
      while (x < qr.size) {
        if (!qr.get(x, y)) { x++; continue; }
        var start = x;
        while (x < qr.size && qr.get(x, y)) x++;
        path += "M" + (start + margin) + " " + (y + margin) + "h" + (x - start) + "v1h-" + (x - start) + "z";
      }
    }
    var label = options.label ? ' role="img" aria-label="' + String(options.label).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    }) + '"' : ' aria-hidden="true"';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + " " + dim + '" shape-rendering="crispEdges"' + label + ">" +
      '<rect width="' + dim + '" height="' + dim + '" fill="' + light + '"/><path d="' + path + '" fill="' + dark + '"/></svg>';
  }

  root.ItsvcQR = { create: create, svg: svg };
})(typeof window !== "undefined" ? window : this);
