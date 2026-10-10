// Add new games here, then register their launch handler in app.js.
export const GAMES = [
  { id: 'fishing', title: 'Petualangan memancing', description: 'Lima kedalaman, ikan langka, dan kejutan di Teluk Ceria.', icon: '⚓', category: 'PETUALANGAN', available: true, modes: ['Solo'], duration: '90 detik', action: 'Masuk ke teluk' },
  { id: 'tic-tac-toe', title: 'Tic Tac Toe', description: 'Tiga simbol berbaris. Tantangan kecil untuk jeda santaimu.', icon: '×○', category: 'ARCADE', available: false, modes: ['2 pemain lokal', 'Lawan bot'], duration: 'Segera hadir' },
  { id: 'chess', title: 'Catur', description: 'Satu papan, banyak strategi. Rencanakan langkah terbaikmu.', icon: '♜', category: 'STRATEGI', available: false, modes: ['2 pemain lokal', 'Lawan bot'], duration: 'Segera hadir' },
];
