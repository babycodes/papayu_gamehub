// Small, original vector portraits. Bundled locally: no image service or CDN.
const portrait = (background, shapes) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="${background}"/><g stroke="#363a44" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${shapes}</g></svg>`)}`;
const eyes = (y = 44) =>
  `<ellipse cx="35" cy="${y}" rx="4" ry="6" fill="#fff"/><ellipse cx="60" cy="${y}" rx="4" ry="6" fill="#fff"/><circle cx="36" cy="${y + 1}" r="2" fill="#363a44"/><circle cx="59" cy="${y + 1}" r="2" fill="#363a44"/>`;
const smile = '<path d="M37 61q11 10 22 0" fill="none"/>';
const kid = (shirt, hair, extras = "") =>
  `<path d="M16 96V81q32-22 64 0v15" fill="${shirt}"/><ellipse cx="48" cy="48" rx="32" ry="31" fill="#e0c4ad"/>${hair}${eyes()}${smile}${extras}`;
const hair =
  '<path d="M17 37q-1-27 29-25 32-2 34 25L65 30l-12 4-12-8-12 10z" fill="#32353e"/>';
const hatFace = (color, letter) =>
  `<path d="M19 96q0-23 29-23t29 23" fill="${color}"/><ellipse cx="48" cy="51" rx="29" ry="30" fill="#e1c2a9"/><path d="M18 34Q18 5 48 7q30 0 30 27" fill="${color}"/><path d="M14 34q34-11 68 0v7H14z" fill="${color}"/><circle cx="48" cy="22" r="12" fill="#fff"/><text x="48" y="29" text-anchor="middle" fill="${color}" stroke="none" font-family="Arial" font-weight="bold" font-size="20">${letter}</text>${eyes(47)}<path d="M24 62q9-16 24-4 15-12 24 4-10 10-24 3-14 7-24-3" fill="#493c37"/><ellipse cx="48" cy="54" rx="11" ry="9" fill="#e1c2a9"/>`;
export const CHARACTER_THEMES = {
  shinchan: {
    name: "Shinchan",
    labels: ["Shinchan", "Shiro", "Himawari", "Kazama", "Nene", "Masao"],
    pictures: [
      portrait(
        "#e2d4a8",
        kid(
          "#c3615d",
          hair,
          '<path d="M26 34l15-2m13 0 15 2" stroke-width="6"/><ellipse cx="24" cy="55" rx="8" ry="5" fill="#d9a9a0" stroke="none"/><ellipse cx="71" cy="55" rx="8" ry="5" fill="#d9a9a0" stroke="none"/>',
        ),
      ),
      portrait(
        "#bcd4de",
        '<path d="M23 39Q5 20 9 55q0 19 17 11m47-27q18-19 14 16 0 19-17 11" fill="#fff"/><ellipse cx="48" cy="51" rx="30" ry="28" fill="#fff"/><circle cx="35" cy="46" r="3"/><circle cx="61" cy="46" r="3"/><ellipse cx="48" cy="57" rx="6" ry="4" fill="#363a44"/><path d="M48 61v6m-9-1q9 10 18 0" fill="none"/>',
      ),
      portrait(
        "#e2c8d1",
        kid(
          "#e1cf85",
          '<path d="M17 36Q18 9 48 12t31 24" fill="#b27847"/><path d="M27 29q-6-15 7-14t6 13q-5-20 9-17t3 17q7-17 17-8" fill="none" stroke="#8e5e3e" stroke-width="5"/>',
          '<circle cx="23" cy="57" r="5" fill="#d7a69e" stroke="none"/>',
        ),
      ),
      portrait(
        "#c0cfdd",
        kid(
          "#6282b4",
          '<path d="M16 37Q17 5 51 12q30 4 29 33L61 23q-5 20-45 14" fill="#37445c"/>',
        ),
      ),
      portrait(
        "#dfc8d5",
        kid(
          "#d28faa",
          '<path d="M14 46Q9 12 48 12t34 34L69 26l-13 7-17-9-11 14v34H15z" fill="#745545"/>',
          '<path d="M68 18l-11-8-2 17 13-4 13 7V12z" fill="#d78da7"/>',
        ),
      ),
      portrait(
        "#c3d8c6",
        kid(
          "#97bd95",
          '<path d="M28 24q20-16 40 0M44 18v-7m7 6 4-6" fill="none"/>',
          '<path d="M24 55q-5 6 0 8 5-2 0-8" fill="#9bbfd2" stroke="none"/>',
        ),
      ),
    ],
  },
  spongebob: {
    name: "SpongeBob",
    labels: ["SpongeBob", "Patrick", "Squidward", "Sandy", "Mr. Krabs", "Gary"],
    pictures: [
      portrait(
        "#bad7d9",
        '<rect x="13" y="10" width="70" height="76" rx="10" fill="#e1d07c"/><g fill="#c7b567" stroke="none"><circle cx="22" cy="22" r="4"/><circle cx="74" cy="49" r="5"/><circle cx="23" cy="65" r="4"/></g><circle cx="35" cy="36" r="14" fill="#fff"/><circle cx="61" cy="36" r="14" fill="#fff"/><circle cx="39" cy="37" r="6" fill="#86b8cd"/><circle cx="57" cy="37" r="6" fill="#86b8cd"/><circle cx="39" cy="37" r="3"/><circle cx="57" cy="37" r="3"/><path d="M28 58q20 23 41 0" fill="#8c5945"/><path d="M40 61h16v10H40z" fill="#fff"/><path d="M13 77h70v9H13" fill="#fff"/><path d="m43 78 5 5 5-5-5 13z" fill="#c16867"/>',
      ),
      portrait(
        "#c1d8c9",
        '<path d="M12 71 25 49 35 15q13-19 22 0l13 34 15 22-24-4 2 20H30l3-20z" fill="#d9a4a9"/> ' +
          eyes(40) +
          smile +
          '<path d="M28 77h38v12H28z" fill="#afca91"/><path d="M32 78l8 8m14-8 7 8" stroke="#947fa1" stroke-width="5"/>',
      ),
      portrait(
        "#cad6de",
        '<ellipse cx="48" cy="33" rx="29" ry="23" fill="#9fbdb7"/><path d="M30 49h36l9 39H21z" fill="#acc6bf"/><ellipse cx="36" cy="40" rx="10" ry="14" fill="#e3ddc4"/><ellipse cx="60" cy="40" rx="10" ry="14" fill="#e3ddc4"/><path d="M29 37h14m10 0h14"/><circle cx="37" cy="45" r="3" fill="#885048"/><circle cx="59" cy="45" r="3" fill="#885048"/><ellipse cx="48" cy="57" rx="10" ry="18" fill="#90b2ab"/><path d="M32 79h32"/>',
      ),
      portrait(
        "#c9d4df",
        '<circle cx="48" cy="48" r="39" fill="#d7e0e0"/><circle cx="29" cy="28" r="12" fill="#b59a7d"/><circle cx="67" cy="28" r="12" fill="#b59a7d"/><ellipse cx="48" cy="50" rx="26" ry="27" fill="#b69b82"/> ' +
          eyes(43) +
          '<ellipse cx="48" cy="60" rx="18" ry="12" fill="#ddceb6"/><path d="M45 51h6l-3 5z" fill="#363a44"/><path d="M43 61h10v10H43z" fill="#fff"/><path d="M28 83h40" stroke="#a4afb7" stroke-width="7"/><circle cx="70" cy="17" r="8" fill="#d49bb0"/>',
      ),
      portrait(
        "#bcd4de",
        '<path d="M12 77q8-21 36-21t36 21v15H12z" fill="#9cbfd2"/><ellipse cx="48" cy="54" rx="32" ry="25" fill="#d18d82"/><path d="M34 37V13m28 24V13" stroke="#d18d82" stroke-width="9"/><ellipse cx="34" cy="17" rx="7" ry="13" fill="#e3ddc1"/><ellipse cx="62" cy="17" rx="7" ry="13" fill="#e3ddc1"/><circle cx="35" cy="18" r="3"/><circle cx="61" cy="18" r="3"/><path d="M30 58q18 14 36 0" fill="none"/><path d="M9 64 2 44l14 4 1-13 15 20m55 9 7-20-14 4-1-13-15 20" fill="#d18d82"/>',
      ),
      portrait(
        "#c9daca",
        '<path d="M13 79q19-17 65-5l12 10H8z" fill="#a3bdc1"/><circle cx="37" cy="54" r="27" fill="#d5aab4"/><path d="M40 70q-25-1-16-24 8-14 22-3 9 13-5 17-10 0-6-9" fill="none" stroke="#896182" stroke-width="4"/><path d="M66 72V26m14 45V20" stroke="#9dbcbf" stroke-width="7"/><circle cx="66" cy="26" r="9" fill="#ded7b2"/><circle cx="80" cy="20" r="9" fill="#ded7b2"/><circle cx="68" cy="26" r="3"/><circle cx="82" cy="20" r="3"/>',
      ),
    ],
  },
  mario: {
    name: "Super Mario",
    labels: ["Mario", "Luigi", "Peach", "Yoshi", "Toad", "Bowser"],
    pictures: [
      portrait("#c0d4de", hatFace("#bd5e5e", "M")),
      portrait("#c9dac7", hatFace("#79ad88", "L")),
      portrait(
        "#e2cfd6",
        '<path d="M15 87V40Q13 8 48 11t33 29v47" fill="#dcc685"/><ellipse cx="48" cy="51" rx="25" ry="28" fill="#e0c4b1"/><path d="M19 39 42 23l13 11 20 8" fill="#dcc685"/>' +
          eyes(47) +
          smile +
          '<path d="m33 20-4-15 13 6 6-9 6 9 13-6-4 15z" fill="#e0c57e"/><circle cx="48" cy="13" r="4" fill="#ba6e89"/><path d="M19 96q0-21 29-21t29 21" fill="#d39aaf"/><circle cx="48" cy="85" r="6" fill="#91b8c7"/>',
      ),
      portrait(
        "#cad9bf",
        '<path d="M17 85q2-22 23-25V34q0-23 22-22t21 24v40L66 90z" fill="#8eb684"/><ellipse cx="48" cy="62" rx="33" ry="22" fill="#99c28e"/><ellipse cx="42" cy="72" rx="25" ry="11" fill="#dcdac3"/><ellipse cx="54" cy="28" rx="8" ry="14" fill="#fff"/><ellipse cx="71" cy="28" rx="8" ry="14" fill="#fff"/><circle cx="55" cy="30" r="3"/><circle cx="70" cy="30" r="3"/><circle cx="25" cy="56" r="2"/><circle cx="39" cy="53" r="2"/><path d="M45 75q13 5 22-3" fill="none"/>',
      ),
      portrait(
        "#ced4de",
        '<path d="M17 96q0-25 31-25t31 25" fill="#8fa4c8"/><ellipse cx="48" cy="62" rx="25" ry="23" fill="#e0c4af"/><path d="M6 45Q4 5 48 6t42 39q-42 17-84 0z" fill="#e3ded5"/><ellipse cx="48" cy="26" rx="15" ry="18" fill="#bc6766"/><path d="M7 24q16-4 17 16L9 43m78-19q-16-4-17 16l17 3" fill="#bc6766"/><circle cx="39" cy="61" r="3"/><circle cx="57" cy="61" r="3"/><path d="M40 73q8 5 16 0" fill="none"/>',
      ),
      portrait(
        "#e1d1b5",
        '<path d="M16 91V43q0-27 32-27t32 27v48" fill="#86ab8c"/><path d="m21 31-10-20 20 10m44 10 10-20-20 10" fill="#e2d9c2"/><path d="m29 30 10-20 9 12 10-12 10 20" fill="#cf9573"/><ellipse cx="48" cy="59" rx="33" ry="29" fill="#d6be8a"/><path d="M24 40l17 5m14 0 17-5" stroke="#a0644b" stroke-width="7"/>' +
          eyes(50) +
          '<path d="M28 69q20 14 40 0l-7 15H35z" fill="#6e544f"/><path d="m33 72 5 9 5-7m10 0 5 7 5-9" fill="#e3dbc6"/>',
      ),
    ],
  },
};
