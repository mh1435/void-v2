/* =========================================================
   VOID // GAMEHUB CONTENT DATABASE ENGINE (2026 MATRIX)
   ========================================================= */

const HERO_CDN_IMGS = {
  'saber': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_15e49c7cc5398ca2d903a485145c0702.jpg&output=jpg&w=400',
  'karina': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_37b5cfef887a7afc63dfaf7b6dfd65c4.jpg&output=jpg&w=400',
  'fanny': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_74fabc6c0d5db065fbb836b6879f36ca.jpg&output=jpg&w=400',
  'hayabusa': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_82560b092a98bcb328def807a2a48cfe.jpg&output=jpg&w=400',
  'natalia': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_79e90c124d786bbfdae31f3a28827e7d.jpg&output=jpg&w=400',
  'lancelot': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_015bacc4e1111e5e2b4a33b5e58ff106.jpg&output=jpg&w=400',
  'helcurt': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_7d54de9ffe40c05d51b4a27318ed5f6d.jpg&output=jpg&w=400',
  'gusion': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2Fa888de3fe448be8f29b50a62d0193aaf.jpg&output=jpg&w=400',
  'selena': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_4ce7dbe0cbcbaf4c2fcc47bd96780b35.jpg&output=jpg&w=400',
  'hanzo': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F4e77b4cc8c101bbd62f548ed10ea1ed4.jpg&output=jpg&w=400',
  'ling': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_f76a7dfe805afa316e5ec44295b75772.jpg&output=jpg&w=400',
  'benedetta': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_2153076135c5ea537f796c4352dd9800.jpg&output=jpg&w=400',
  'aamon': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_26b1c0ec95ad9e98f81b07d6838a8652.jpg&output=jpg&w=400',
  'joy': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_f647bf6dbb80b4b2b2310ab5af88773d.jpg&output=jpg&w=400',
  'nolan': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_cae4b6dafe9d345f84eee1c983333c0c.jpg&output=jpg&w=400',
  'sora': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2Fd6348e65d8d0d4ca8b0738d691cef440.jpg&output=jpg&w=400',
  'hirara': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2Ff156378413102969d6682fe940755d70.jpg&output=jpg&w=400',
  'balmond': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_8f49801963afcd9b7c6fe6f59153ccc0.jpg&output=jpg&w=400',
  'chou': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_011409dfe1a2cf4cf5f879ea07fb3a8e.jpg&output=jpg&w=400',
  'ruby': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_2cfc71331f6e2435394bfa44c322405c.jpg&output=jpg&w=400',
  'lapu-lapu': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_d407ccb622db392981d2fceff06d757c.jpg&output=jpg&w=400',
  'alucard': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_c9a8a8b1bb1fed4190f3168d44810ce3.jpg&output=jpg&w=400',
  'bane': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_7060e1c063474bb8ff9472d61f7ce4c3.jpg&output=jpg&w=400',
  'zilong': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_90df181873c42df22049aa056662a934.jpg&output=jpg&w=400',
  'freya': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F71d910744206adec64f7c5e97b0698c7.jpg&output=jpg&w=400',
  'sun': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_5dd440a371270f458071305b9bf107b5.jpg&output=jpg&w=400',
  'alpha': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_0fd2c33fbf0235703b1c936059cf1b8e.jpg&output=jpg&w=400',
  'roger': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_ff92c4b5afb41060af1b951ba9f03edd.jpg&output=jpg&w=400',
  'gatotkaca': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_a9a9551515638bb9b6128eef1ee916bd.jpg&output=jpg&w=400',
  'jawhead': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_a48e93159c30c31e05dcd6cf7f53c07c.jpg&output=jpg&w=400',
  'martis': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_01b9995a75249c3155ca96e4713139a9.jpg&output=jpg&w=400',
  'aldous': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_e4f7847a1b687a2e4f414e531cd66b1b.jpg&output=jpg&w=400',
  'leomord': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_77c6d6b5b84b658c8f25e6f371658cbd.jpg&output=jpg&w=400',
  'thamuz': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F1699a938c6938947e534aa2874341d58.jpg&output=jpg&w=400',
  'minsitthar': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_5a18fa300eb0de4324601c116eab655c.jpg&output=jpg&w=400',
  'badang': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_ce3e2759eb9ccd7a94ae3a2ee4e8b8e7.jpg&output=jpg&w=400',
  'guinevere': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_5acbfb73c47c25d4689f93c3c950fc8f.jpg&output=jpg&w=400',
  'terizla': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_2352b6ef3a86441e2a3880fa436df1de.jpg&output=jpg&w=400',
  'x-borg': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F52e2334206e3b30354b129f86ada1ef5.jpg&output=jpg&w=400',
  'dyrroth': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F636054ad39847fcc242d0b03feadffac.jpg&output=jpg&w=400',
  'silvanna': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_a9de8642b6e62f44652c519f153620d2.jpg&output=jpg&w=400',
  'yu-zhong': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_97280cb443adc3bcb4ca9b36a0fada53.jpg&output=jpg&w=400',
  'khaleed': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_155712d0d854711a12f2754865acc17b.jpg&output=jpg&w=400',
  'paquito': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_ef4c59d1923663a6aaa77d1c0a7ff258.jpg&output=jpg&w=400',
  'phoveus': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_b811616b91e45a75437a6d5b9f386bd3.jpg&output=jpg&w=400',
  'yin': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_5324c7bcbfd9932aca9b8d2e7b8e307a.jpg&output=jpg&w=400',
  'julian': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_5b493fa77cd6ea1a799577a69c86fbd2.jpg&output=jpg&w=400',
  'fredrinn': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_bafe5308a1e6db91ba57e39c45874a92.jpg&output=jpg&w=400',
  'cici': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_eb1705dc650b3980d57c638d02bfb470.jpg&output=jpg&w=400',
  'arlott': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_d29e8f9f2d129f18a944da0a8e9044c2.jpg&output=jpg&w=400',
  'aulus': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2Fdf1df2053afbdda1167d647bbb8b3a81.jpg&output=jpg&w=400',
  'masha': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_59893811b0123dc6babca117f5ead017.jpg&output=jpg&w=400',
  'suyou': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F13912f0dbc96b6cf53a00e80ff731dab.jpg&output=jpg&w=400',
  'lukas': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F95b6f94a0e37fd02e069223493540e75.jpg&output=jpg&w=400',
  'kalea': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F6bde4242228d5ea98b700c9cfc1e837d.jpg&output=jpg&w=400',
  'miya': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F6667b3e9109ca180e63c524471f29278.jpg&output=jpg&w=400',
  'popol': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_555eb8df475f57d6f01a1f2a2675671c.jpg&output=jpg&w=400',
  'bruno': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_03cd0ea0a0f0bd80ca4f7462174f80b1.jpg&output=jpg&w=400',
  'clint': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_8136b5ece3387dfe347956f797a14a5d.jpg&output=jpg&w=400',
  'layla': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_0db5131842bec1fdbdf5f8533ebada2c.jpg&output=jpg&w=400',
  'moskov': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_843f1c2c3a1b2d4da2fc2ec73cf47cfa.jpg&output=jpg&w=400',
  'karrie': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_bd34b1ec70de7a32b724dd606cb56331.jpg&output=jpg&w=400',
  'iridhel': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_f999fb58616e2d87c29dcb92177990f5.jpg&output=jpg&w=400',
  'hanabi': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F0208ca2382d8cfdcd277ef5d532316f7.jpg&output=jpg&w=400',
  'claude': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_1edf19b0839ffd2bffb60b4ee4953239.jpg&output=jpg&w=400',
  'kimmy': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2Ff2851daf34080fb5406f8d602b9fa489.jpg&output=jpg&w=400',
  'granger': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F5d272478f2f89dcae9e6896cb19743ac.jpg&output=jpg&w=400',
  'wanwan': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F9b163e2146ae6b0e84941032c3f10a41.png&output=jpg&w=400',
  'brody': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_9a3feb044b76ac87f886a0fdf4ef4f13.jpg&output=jpg&w=400',
  'beatrix': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_2f25a8ef9bbb2d52eaaea8d6eee85d22.jpg&output=jpg&w=400',
  'melissa': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_5c2a434757066a779c8adec5af05a8d1.jpg&output=jpg&w=400',
  'ixia': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_48896a3cf0ee41c3d54c2b651ed926ea.jpg&output=jpg&w=400',
  'natan': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_bc73ea56e3e05b4f9ed8046b959e1290.jpg&output=jpg&w=400',
  'lesley': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F1f0d645266d902f3f927ea7fc04c1bca.jpg&output=jpg&w=400',
  'obsidia': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F1dca7f088da27d5a12faf83f7c1f8269.jpg&output=jpg&w=400',
  'alice': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F66c9a33b830173a5fd93d9940429b491.jpg&output=jpg&w=400',
  'eudora': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F8db55c33fd2a5c84822a2a6c51e1fb18.jpg&output=jpg&w=400',
  'gord': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2Ffe7d492d0a71f96da12ff710d41a76cb.jpg&output=jpg&w=400',
  'kagura': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_64bda78279297278301e236555a15404.jpg&output=jpg&w=400',
  'cyclops': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_b506976dcb608de1f369ab8f6b3cb055.jpg&output=jpg&w=400',
  'aurora': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_58b97db6a5c286059057d42289612b16.jpg&output=jpg&w=400',
  'vexana': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_f1a01e297d30d147c16342efc357275e.jpg&output=jpg&w=400',
  'harley': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_7b867b2f05de71466a0e98ea6898eff2.jpg&output=jpg&w=400',
  'odette': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_7448f16293a6be9311f82d581e78749a.jpg&output=jpg&w=400',
  'zhask': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_6e99f11105dc89bff1932cd4b3809c12.jpg&output=jpg&w=400',
  'pharsa': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_353d39f8ae9ea1454e34ad8546db8417.jpg&output=jpg&w=400',
  'valir': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_7a285a7d75ceb5fecceec6b2608b232f.jpg&output=jpg&w=400',
  'chang-e': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_bf3d5cdc1c0e33f5aab7732e153c7409.jpg&output=jpg&w=400',
  'vale': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_25040275a37d04d6ed8930a64f9e20bd.jpg&output=jpg&w=400',
  'lunox': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_8cd47d47126be5496fecb45304368069.jpg&output=jpg&w=400',
  'harith': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_c1dcef05408b7c644298bab812517de3.jpg&output=jpg&w=400',
  'kadita': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_3671cbec60a1b4f62971d37e7ecc0e89.jpg&output=jpg&w=400',
  'esmeralda': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_980e6419f7763a9dd26818312d73cc6d.jpg&output=jpg&w=400',
  'lylia': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_8d16667b16673a1919c513fa46bbf2d0.jpg&output=jpg&w=400',
  'cecilision': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_71d6b7fc8cfe8fd9b0c20ad3be1af4e8.jpg&output=jpg&w=400',
  'yve': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F0b6e910cb702dcbb68614c9bac4ba590.jpg&output=jpg&w=400',
  'valentina': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_cdd151e2293c14b2abc3c1c8e57d4392.jpg&output=jpg&w=400',
  'xavier': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_6ebaf2a24b6b6cf256c9bae408b0400e.jpg&output=jpg&w=400',
  'novaria': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_b2599c8a6c681afdee9a06a92190a58d.jpg&output=jpg&w=400',
  'zhuxin': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage_92%2F100_999ac33ac284f6dc38a5f5ae7a6921b8.jpg&output=jpg&w=400',
  'luo-yi': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_52c14752b29b6f9039da26a50e860c5c.jpg&output=jpg&w=400',
  'zetian': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2Fb617a6b4d9e2c22a5bc24d886e453399.jpg&output=jpg&w=400',
  'tigreal': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_ec2ad5967a2d8a0ac5e2cef2a1e24411.jpg&output=jpg&w=400',
  'akai': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_2fab842e4c04d903b1b46c3c4a1d02ad.jpg&output=jpg&w=400',
  'franco': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_ad018d324520174ab87b3a1098507fb6.jpg&output=jpg&w=400',
  'minotaur': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_db4fda77f902f3dde09d247498da23cc.jpg&output=jpg&w=400',
  'johnson': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_b40543fb2ad8f8ef198c66f0d9eadeef.jpg&output=jpg&w=400',
  'hilda': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_35f2e88037398136c01b314deb573eb0.jpg&output=jpg&w=400',
  'grock': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2Fc5df319054bcefec1d17c771b45b9e10.jpg&output=jpg&w=400',
  'argus': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_802afa50ffd43d553c3b924d111249c1.jpg&output=jpg&w=400',
  'hylos': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_bcc177e4f62634fca493732e4058c626.jpg&output=jpg&w=400',
  'uranus': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_1e52a042e596bd333ccab46d00bb8c72.jpg&output=jpg&w=400',
  'belerick': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_64900b3344e166f05645ac5759207897.jpg&output=jpg&w=400',
  'khufra': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_3ffc413118c62fc17f599cb35172ba9c.jpg&output=jpg&w=400',
  'baxia': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_478a4875002331e56e73835a2697ad5d.jpg&output=jpg&w=400',
  'atlas': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_9a217534db9b67c6db2c45d57a0d640c.jpg&output=jpg&w=400',
  'barats': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_1b9fec44c21db9ecba0229ac227c7d51.jpg&output=jpg&w=400',
  'edith': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_0598a42d46dd271410f403b57eb02e2a.jpg&output=jpg&w=400',
  'gloo': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F7257d4ee30eff4d5bc5726027eee5f96.jpg&output=jpg&w=400',
  'angela': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_187b8452435b469e8867e8fb2d387a5b.jpg&output=jpg&w=400',
  'nana': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_4258783f9b44a4ad1c67c0b8781051fa.jpg&output=jpg&w=400',
  'rafaela': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_491618ae5cb3d561f5f02fbb3d82a83d.jpg&output=jpg&w=400',
  'lolita': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_1bc4973e512cf4958fe639e12391666e.jpg&output=jpg&w=400',
  'estes': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_137acad8cd747ef9d0dec755158aff18.jpg&output=jpg&w=400',
  'diggie': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_91b0167c49a789de46de29c3714da515.jpg&output=jpg&w=400',
  'carmilla': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_08d58580aaeaab354c2d267d8746c42d.jpg&output=jpg&w=400',
  'mathilda': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_5d6eb0491da5709648beca54f906c0a3.jpg&output=jpg&w=400',
  'floryn': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_854338f3ad90cb9e14aec15c8b8a08c7.jpg&output=jpg&w=400',
  'faramis': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_a171d8e12dd5eda201750e794dd5e313.jpg&output=jpg&w=400',
  'kaja': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_1a0b70adda2acee8c950dd0982b45e5c.jpg&output=jpg&w=400',
  'chip': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fsvnres%2Ffile%2Fmlbb%2Fhomepage%2F100_fb8b4e345db174545e967b7bcbd219f4.jpg&output=jpg&w=400',
  'marcel': 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F3542718f699058d42801d88ec9b8fb8b.jpg&output=jpg&w=400',
};

const MLBB_HERO_DATA_RAW = [
  // --- ASSASSINS / JUNGLERS ---
  { 
    id: 'saber', 
    role: 'Assassin', 
    rarity: 'S-TIER (META)',
    counters: ['khufra', 'tigreal', 'athena_shield'],
    builds: {
      'One-Shot Burst': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'],
      'CD Reduction Pen': ['hunter_strike', 'bloodlust_axe', 'war_axe', 'malefic_roar', 'rose_gold_meteor', 'immortality']
    }
  },
  { 
    id: 'karina', 
    role: 'Assassin', 
    rarity: 'D-TIER',
    counters: ['athena_shield', 'khufra', 'lolita'],
    builds: {
      'Full Magic Burst': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'],
      'Tank Karina Hybrid': ['thunder_belt', 'radiant_armor', 'antique_cuirass', 'genius_wand', 'immortality', 'guardian_helmet']
    }
  },
  { 
    id: 'fanny', 
    role: 'Assassin', 
    rarity: 'D-TIER',
    counters: ['khufra', 'masha', 'chou', 'saber'],
    builds: {
      'S-Tier Hyper DMG': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor', 'immortality'],
      'Sustain Offlane': ['bloodlust_axe', 'hunter_strike', 'war_axe', 'brute_force_breastplate', 'athena_shield', 'immortality']
    }
  },
  { 
    id: 'hayabusa', 
    role: 'Assassin', 
    rarity: 'C-TIER',
    counters: ['khufra', 'saber', 'winter_crown'],
    builds: {
      'Hyper Carry Jungle': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'],
      'Anti-Tank Pen': ['hunter_strike', 'corrosion_scythe', 'demon_hunter_sword', 'malefic_roar', 'rose_gold_meteor', 'immortality']
    }
  },
  { 
    id: 'natalia', 
    role: 'Assassin', 
    rarity: 'B-TIER',
    counters: ['hylos', 'baxia', 'rafaela'],
    builds: {
      'Roam Roamer Execute': ['blade_of_the_heptaseas', 'hunter_strike', 'windtalker', 'berserker_fury', 'malefic_roar', 'blade_of_despair']
    }
  },
  { 
    id: 'lancelot', 
    role: 'Assassin', 
    rarity: 'D-TIER',
    counters: ['khufra', 'phoveus', 'masha'],
    builds: {
      'Full Physical DMG': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'endless_battle', 'malefic_roar', 'immortality'],
      'Tank Meta Jungle': ['thunder_belt', 'brute_force_breastplate', 'radiant_armor', 'guardian_helmet', 'antique_cuirass', 'immortality']
    }
  },
  { 
    id: 'helcurt', 
    role: 'Assassin', 
    rarity: 'S-TIER (META)',
    counters: ['hylos', 'baxia', 'tigreal'],
    builds: {
      'Burst Damage': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'windtalker', 'immortality']
    }
  },
  { 
    id: 'gusion', 
    role: 'Assassin/Mage', 
    rarity: 'A-TIER',
    counters: ['athena_shield', 'khufra', 'lolita'],
    builds: {
      'Magic Core Dmg': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings']
    }
  },
  { 
    id: 'selena', 
    role: 'Assassin/Mage', 
    rarity: 'B-TIER',
    counters: ['diggie', 'radiant_armor', 'lolita'],
    builds: {
      'Roam Dire Hit Poke': ['enchanted_talisman', 'genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown']
    }
  },
  { id: 'hanzo', role: 'Assassin', rarity: 'B-TIER', counters: ['natalia', 'ling'], builds: { 'Attack Speed Carry': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'windtalker', 'malefic_roar', 'immortality'] } },
  { id: 'ling', role: 'Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'saber', 'masha'], builds: { 'Crit Rate Burst': ['windtalker', 'berserker_fury', 'haas_claws', 'endless_battle', 'malefic_roar', 'immortality'] } },
  { id: 'benedetta', role: 'Assassin', rarity: 'A-TIER', counters: ['phoveus', 'khufra', 'masha'], builds: { 'EXP Lane Sustain': ['bloodlust_axe', 'hunter_strike', 'war_axe', 'brute_force_breastplate', 'athena_shield', 'immortality'] } },
  { id: 'aamon', role: 'Assassin', rarity: 'A-TIER', counters: ['athena_shield', 'radiant_armor'], builds: { 'Magic Execute': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'] } },
  { id: 'joy', role: 'Assassin', rarity: 'A-TIER', counters: ['masha', 'saber', 'khufra'], builds: { 'Magic Shield-Sustain': ['genius_wand', 'holy_crystal', 'glowing_wand', 'oracle', 'winter_crown', 'immortality'] } },
  { id: 'nolan', role: 'Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'saber', 'tigreal'], builds: { 'Maximum CD Pen': ['hunter_strike', 'blade_of_the_heptaseas', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'sora', role: 'Fighter/Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'masha'], builds: { 'Jungle Meta Carry': ['hunter_strike', 'blade_of_despair', 'malefic_roar', 'immortality', 'rose_gold_meteor', 'war_axe'] } },
  { id: 'hirara', role: 'Assassin', rarity: 'A-TIER', counters: ['saber', 'hylos'], builds: { 'Burst Assassin': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'immortality', 'endless_battle'] } },

  // --- FIGHTERS / EXP LANE ---
  { 
    id: 'balmond', 
    role: 'Fighter', 
    rarity: 'B-TIER',
    counters: ['baxia', 'valir', 'dominance_ice'],
    builds: {
      'Jungle Utility Tank': ['war_axe', 'cursed_helmet', 'dominance_ice', 'guardian_helmet', 'radiant_armor', 'immortality'],
      'EXP Lane True DMG': ['war_axe', 'hunter_strike', 'bloodlust_axe', 'brute_force_breastplate', 'oracle', 'immortality']
    }
  },
  { 
    id: 'chou', 
    role: 'Fighter', 
    rarity: 'D-TIER',
    counters: ['khufra', 'phoveus', 'diggie'],
    builds: {
      'One-Shot Damage': ['blade_of_the_heptaseas', 'hunter_strike', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'],
      'Roam Setup Tank': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'brute_force_breastplate', 'guardian_helmet', 'immortality']
    }
  },
  { 
    id: 'ruby', 
    role: 'Fighter', 
    rarity: 'A-TIER',
    counters: ['baxia', 'valir', 'dominance_ice'],
    builds: {
      'EXP Spellvamp Offlane': ['war_axe', 'bloodlust_axe', 'dominance_ice', 'oracle', 'brute_force_breastplate', 'immortality'],
      'Roam Crowd Control': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'oracle', 'thunder_belt', 'immortality']
    }
  },
  { 
    id: 'lapu-lapu', 
    role: 'Fighter', 
    rarity: 'C-TIER',
    counters: ['baxia', 'valir', 'dominance_ice'],
    builds: {
      'Sustain Offlane DMG': ['bloodlust_axe', 'hunter_strike', 'war_axe', 'brute_force_breastplate', 'oracle', 'immortality'],
      'Full Tank Frontline': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'radiant_armor', 'immortality']
    }
  },
  { id: 'alucard', role: 'Fighter', rarity: 'B-TIER', counters: ['baxia', 'khufra'], builds: { 'Lifesteal Burst': ['haas_claws', 'hunter_strike', 'endless_battle', 'berserker_fury', 'malefic_roar', 'immortality'] } },
  { id: 'bane', role: 'Fighter/Mage', rarity: 'A-TIER', counters: ['saber', 'gusion'], builds: { 'Magic Cannon': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'], 'Physical Burst': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'] } },
  { id: 'zilong', role: 'Fighter/Assassin', rarity: 'B-TIER', counters: ['khufra', 'hylos'], builds: { 'Push Master': ['windtalker', 'berserker_fury', 'great_dragon_spear', 'demon_hunter_sword', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'freya', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'khufra'], builds: { 'Crit Attack Speed': ['corrosion_scythe', 'haas_claws', 'berserker_fury', 'great_dragon_spear', 'malefic_roar', 'immortality'] } },
  { id: 'sun', role: 'Fighter', rarity: 'B-TIER', counters: ['ruby', 'balmond'], builds: { 'Clone Shredder': ['corrosion_scythe', 'demon_hunter_sword', 'war_axe', 'dominance_ice', 'brute_force_breastplate', 'immortality'] } },
  { id: 'alpha', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'valir'], builds: { 'True DMG Jungle': ['war_axe', 'bloodlust_axe', 'hunter_strike', 'dominance_ice', 'oracle', 'immortality'] } },
  { id: 'roger', role: 'Fighter/Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'khufra'], builds: { 'Gold Lane Carry': ['windtalker', 'demon_hunter_sword', 'corrosion_scythe', 'brute_force_breastplate', 'rose_gold_meteor', 'immortality'] } },
  { id: 'gatotkaca', role: 'Tank/Fighter', rarity: 'B-TIER', counters: ['karrie', 'divine_glaive'], builds: { 'Magic Tank Vengeance': ['cursed_helmet', 'dominance_ice', 'athena_shield', 'holy_crystal', 'glowing_wand', 'immortality'] } },
  { id: 'jawhead', role: 'Fighter', rarity: 'B-TIER', counters: ['khufra', 'tigreal'], builds: { 'Assassination Core': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'] } },
  { id: 'martis', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'valir'], builds: { 'Semi-Tank Jungle': ['hunter_strike', 'war_axe', 'dominance_ice', 'antique_cuirass', 'athena_shield', 'immortality'] } },
  { id: 'aldous', role: 'Fighter', rarity: 'B-TIER', counters: ['twilight_armor', 'franco'], builds: { '500 Stack One-Punch': ['thunder_belt', 'twilight_armor', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'leomord', role: 'Fighter', rarity: 'B-TIER', counters: ['khufra', 'tigreal'], builds: { 'Crit Charge Core': ['hunter_strike', 'bloodlust_axe', 'berserker_fury', 'malefic_roar', 'blade_of_despair', 'immortality'] } },
  { id: 'thamuz', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Attack Speed Sustain': ['corrosion_scythe', 'demon_hunter_sword', 'dominance_ice', 'radiant_armor', 'antique_cuirass', 'immortality'] } },
  { id: 'minsitthar', role: 'Fighter', rarity: 'A-TIER', counters: ['diggie', 'valir'], builds: { 'On-Hit King': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'dominance_ice', 'athena_shield', 'immortality'] } },
  { id: 'badang', role: 'Fighter', rarity: 'B-TIER', counters: ['khufra', 'antique_cuirass'], builds: { 'Wall Combo Burst': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'hunter_strike', 'malefic_roar', 'immortality'] } },
  { id: 'guinevere', role: 'Fighter/Mage', rarity: 'A-TIER', counters: ['diggie', 'athena_shield'], builds: { 'Magic Knockup Burst': ['genius_wand', 'glowing_wand', 'holy_crystal', 'star_shard', 'winter_crown', 'immortality'] } },
  { id: 'terizla', role: 'Fighter', rarity: 'S-TIER (META)', counters: ['valir', 'karrie'], builds: { 'Pure EXP Lane Frontline': ['bloodlust_axe', 'dominance_ice', 'antique_cuirass', 'athena_shield', 'guardian_helmet', 'immortality'] } },
  { id: 'x-borg', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'radiant_armor'], builds: { 'True DMG Spellvamp': ['immortality', 'war_axe', 'bloodlust_axe', 'glowing_wand', 'ice_queen_wand', 'oracle'] } },
  { id: 'dyrroth', role: 'Fighter', rarity: 'A-TIER', counters: ['khufra', 'saber'], builds: { 'Armor Shredder Core': ['hunter_strike', 'blade_of_the_heptaseas', 'bloodlust_axe', 'malefic_roar', 'antique_cuirass', 'immortality'] } },
  { id: 'silvanna', role: 'Fighter', rarity: 'B-TIER', counters: ['diggie', 'athena_shield'], builds: { 'Magic Lock Core': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'radiant_armor', 'athena_shield', 'immortality'] } },
  { id: 'yu-zhong', role: 'Fighter', rarity: 'S-TIER (META)', counters: ['baxia', 'dominance_ice'], builds: { 'Dragon Meta Sustain': ['hunter_strike', 'bloodlust_axe', 'war_axe', 'dominance_ice', 'oracle', 'immortality'] } },
  { id: 'khaleed', role: 'Fighter', rarity: 'B-TIER', counters: ['saber', 'franco'], builds: { 'Early Game Aggro': ['blade_of_the_heptaseas', 'hunter_strike', 'bloodlust_axe', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'paquito', role: 'Fighter', rarity: 'S-TIER (META)', counters: ['khufra', 'saber'], builds: { 'Combo Burst Jungle': ['hunter_strike', 'blade_of_the_heptaseas', 'bloodlust_axe', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'phoveus', role: 'Fighter', rarity: 'B-TIER', counters: ['athena_shield', 'esmeralda'], builds: { 'Anti-Dash Counter Magic': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'oracle', 'brute_force_breastplate', 'immortality'] } },
  { id: 'yin', role: 'Fighter', rarity: 'B-TIER', counters: ['winter_crown', 'wind_of_nature'], builds: { 'Domain Arena Executioner': ['blade_of_the_heptaseas', 'hunter_strike', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'julian', role: 'Fighter/Mage', rarity: 'S-TIER (META)', counters: ['athena_shield', 'radiant_armor'], builds: { 'Enhanced Skill Core Magic': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'] } },
  { id: 'fredrinn', role: 'Tank/Fighter', rarity: 'A-TIER', counters: ['karrie', 'divine_glaive'], builds: { 'Taunt Overlord Jungle': ['cursed_helmet', 'guardian_helmet', 'dominance_ice', 'radiant_armor', 'antique_cuirass', 'immortality'] } },
  { id: 'cici', role: 'Fighter', rarity: 'A-TIER', counters: ['saber', 'khufra'], builds: { 'Kiting Spellvamp': ['war_axe', 'hunter_strike', 'brute_force_breastplate', 'oracle', 'dominance_ice', 'immortality'] } },
  { id: 'arlott', role: 'Fighter', rarity: 'S-TIER (META)', counters: ['phoveus', 'khufra'], builds: { 'Gaze Gank Master': ['hunter_strike', 'endless_battle', 'brute_force_breastplate', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'aulus', role: 'Fighter', rarity: 'B-TIER', counters: ['saber', 'hylos'], builds: { 'Late Game Hyper': ['windtalker', 'berserker_fury', 'haas_claws', 'great_dragon_spear', 'malefic_roar', 'immortality'] } },
  { id: 'masha', role: 'Fighter/Tank', rarity: 'A-TIER', counters: ['twilight_armor', 'blade_armor'], builds: { '3 HP Bar Shredder': ['windtalker', 'berserker_fury', 'blade_of_despair', 'malefic_roar', 'sea_halberd', 'great_dragon_spear'] } },
  { id: 'suyou', role: 'Fighter/Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'saber'], builds: { 'Meta Flex Core': ['hunter_strike', 'blade_of_the_heptaseas', 'war_axe', 'malefic_roar', 'rose_gold_meteor', 'immortality'] } },
  { id: 'lukas', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'valir'], builds: { 'Fighter Core': ['war_axe', 'hunter_strike', 'brute_force_breastplate', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'kalea', role: 'Fighter', rarity: 'A-TIER', counters: ['khufra', 'franco'], builds: { 'EXP Sustainer': ['war_axe', 'bloodlust_axe', 'dominance_ice', 'oracle', 'antique_cuirass', 'immortality'] } },

  // --- MARKSMEN / GOLD LANE ---
  { 
    id: 'miya', 
    role: 'Marksman', 
    rarity: 'A-TIER',
    counters: ['saber', 'blade_armor', 'wind_of_nature'],
    builds: {
      'Crit Attack Speed': ['windtalker', 'berserker_fury', 'haas_claws', 'corrosion_scythe', 'malefic_roar', 'wind_of_nature'],
      'Trinity Melt (Tank shred)': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'sea_halberd', 'wind_of_nature', 'immortality']
    }
  },
  { 
    id: 'popol', 
    role: 'Marksman', 
    rarity: 'B-TIER',
    counters: ['saber', 'gusion', 'wind_of_nature'],
    builds: {
      'Gold Lane Tower Push': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'wind_of_nature'],
      'Roam Trapper Support': ['thunder_belt', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality', 'guardian_helmet']
    }
  },
  { id: 'bruno', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Bounce Crit Burst': ['haas_claws', 'berserker_fury', 'windtalker', 'endless_battle', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'clint', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Passive Ability Burst': ['endless_battle', 'hunter_strike', 'berserker_fury', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor'] } },
  { id: 'layla', role: 'Marksman', rarity: 'B-TIER', counters: ['saber', 'ling', 'gusion'], builds: { 'Max Range Crit': ['windtalker', 'berserker_fury', 'haas_claws', 'great_dragon_spear', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'moskov', role: 'Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'wind_of_nature'], builds: { 'Attack Speed Teleport': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'haas_claws', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'karrie', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Golden Trinity Meta': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'thunder_belt', 'wind_of_nature', 'immortality'] } },
  { id: 'iridhel', role: 'Marksman', rarity: 'B-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Run-and-Gun Crit': ['windtalker', 'berserker_fury', 'haas_claws', 'great_dragon_spear', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'hanabi', role: 'Marksman', rarity: 'B-TIER', counters: ['saber', 'blade_armor'], builds: { 'Bounce CC Immune Setup': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'windtalker', 'sea_halberd', 'wind_of_nature'] } },
  { id: 'claude', role: 'Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'wind_of_nature'], builds: { 'DEX Ultimate Shred': ['demon_hunter_sword', 'golden_staff', 'corrosion_scythe', 'brute_force_breastplate', 'rose_gold_meteor', 'wind_of_nature'] } },
  { id: 'kimmy', role: 'Marksman/Mage', rarity: 'B-TIER', counters: ['radiant_armor', 'lolita'], builds: { 'Magic Searing Aim': ['genius_wand', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'ice_queen_wand', 'winter_crown'] } },
  { id: 'granger', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'khufra'], builds: { 'Jungle Bullet Burst': ['hunter_strike', 'blade_of_the_heptaseas', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'wanwan', role: 'Marksman', rarity: 'A-TIER', counters: ['phoveus', 'khufra'], builds: { 'Crossbow Weakness Melt': ['corrosion_scythe', 'demon_hunter_sword', 'windtalker', 'sea_halberd', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'brody', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Abyss Stack One-Shot': ['blade_of_the_heptaseas', 'hunter_strike', 'malefic_roar', 'blade_of_despair', 'brute_force_breastplate', 'immortality'] } },
  { id: 'beatrix', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Arsenal Heavy Carry': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor', 'immortality'] } },
  { id: 'melissa', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'franco'], builds: { 'Anti-Melee Field Setup': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'haas_claws', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'ixia', role: 'Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'gusion'], builds: { 'Full-Screen Ult Barrage': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'hunter_strike', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'natan', role: 'Marksman', rarity: 'S-TIER (META)', counters: ['athena_shield', 'radiant_armor'], builds: { 'Magic Atk Spd Marksman': ['feather_of_heaven', 'genius_wand', 'holy_crystal', 'divine_glaive', 'glowing_wand', 'wind_of_nature'] } },
  { id: 'lesley', role: 'Marksman/Assassin', rarity: 'B-TIER', counters: ['saber', 'twilight_armor'], builds: { 'Sniper True Damage': ['windtalker', 'berserker_fury', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor'] } },
  { id: 'obsidia', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Gold Core Build': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'malefic_roar', 'wind_of_nature', 'immortality'] } },

  // --- MAGES / MID LANE ---
  { 
    id: 'alice', 
    role: 'Mage', 
    rarity: 'B-TIER',
    counters: ['baxia', 'dominance_ice', 'divine_glaive'],
    builds: {
      'Sustain Magic Tank': ['clock_of_destiny', 'lightning_truncheon', 'dominance_ice', 'glowing_wand', 'oracle', 'winter_crown'],
      'Mid Lane Mage Burst': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown']
    }
  },
  { id: 'eudora', role: 'Mage', rarity: 'B-TIER', counters: ['athena_shield'], builds: { 'Insta-Kill Bush Combo': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'gord', role: 'Mage', rarity: 'B-TIER', counters: ['saber', 'ling'], builds: { 'True DMG Beam Melt': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'kagura', role: 'Mage', rarity: 'A-TIER', counters: ['athena_shield'], builds: { 'Umbrella Burst Combo': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'cyclops', role: 'Mage', rarity: 'B-TIER', counters: ['athena_shield', 'baxia'], builds: { 'CD Spellvamp Core': ['enchanted_talisman', 'concentrated_energy', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'aurora', role: 'Mage', rarity: 'A-TIER', counters: ['athena_shield'], builds: { 'AOE Freeze Control': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'] } },
  { id: 'vexana', role: 'Mage', rarity: 'S-TIER (META)', counters: ['saber', 'ling'], builds: { 'Lord Summon Setup': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'glowing_wand', 'divine_glaive', 'winter_crown'] } },
  { id: 'harley', role: 'Mage/Assassin', rarity: 'B-TIER', counters: ['athena_shield', 'radiant_armor'], builds: { 'Jungle Ring Burst': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'divine_glaive', 'glowing_wand', 'winter_crown'] } },
  { id: 'odette', role: 'Mage', rarity: 'A-TIER', counters: ['tigreal', 'franco', 'athena_shield'], builds: { 'Swan Song CC Combo': ['enchanted_talisman', 'glowing_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'zhask', role: 'Mage', rarity: 'S-TIER (META)', counters: ['radiant_armor'], builds: { 'Spawn Attack Speed': ['clock_of_destiny', 'feather_of_heaven', 'genius_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'pharsa', role: 'Mage', rarity: 'B-TIER', counters: ['saber', 'ling'], builds: { 'Air Strike Burst': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'valir', role: 'Mage', rarity: 'B-TIER', counters: ['radiant_armor', 'assassins'], builds: { 'Anti-Melee Slow Burn': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'radiant_armor', 'athena_shield', 'immortality'] } },
  { id: 'chang-e', role: 'Mage', rarity: 'B-TIER', counters: ['radiant_armor', 'lolita'], builds: { 'Meteor Stream Shred': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'ice_queen_wand', 'divine_glaive', 'winter_crown'] } },
  { id: 'vale', role: 'Mage', rarity: 'B-TIER', counters: ['athena_shield'], builds: { 'Windstorm Crowd Control': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'lunox', role: 'Mage', rarity: 'S-TIER (META)', counters: ['radiant_armor'], builds: { 'Order/Chaos Tank Melter': ['enchanted_talisman', 'genius_wand', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'harith', role: 'Mage', rarity: 'S-TIER (META)', counters: ['khufra', 'masha'], builds: { 'Gold Lane Magic Carry': ['clock_of_destiny', 'calamity_reaper', 'holy_crystal', 'feather_of_heaven', 'oracle', 'winter_crown'] } },
  { id: 'kadita', role: 'Mage/Assassin', rarity: 'A-TIER', counters: ['athena_shield', 'diggie'], builds: { 'Roam Tide Burst': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'immortality'] } },
  { id: 'esmeralda', role: 'Mage/Tank', rarity: 'A-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Shield Absorption Frontline': ['enchanted_talisman', 'dominance_ice', 'oracle', 'brute_force_breastplate', 'glowing_wand', 'immortality'] } },
  { id: 'lylia', role: 'Mage', rarity: 'A-TIER', counters: ['saber', 'athena_shield'], builds: { 'Gloom Explosion Chain': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'cecilision', role: 'Mage', rarity: 'B-TIER', counters: ['assassins', 'athena_shield'], builds: { 'Late Game Mana Stack': ['enchanted_talisman', 'clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'yve', role: 'Mage', rarity: 'B-TIER', counters: ['saber', 'ling'], builds: { 'Grid Matrix Slow': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'genius_wand', 'brute_force_breastplate', 'winter_crown'] } },
  { id: 'valentina', role: 'Mage', rarity: 'S-TIER (META)', counters: ['athena_shield'], builds: { 'Ult Steal Tactician': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'holy_crystal', 'brute_force_breastplate', 'winter_crown'] } },
  { id: 'xavier', role: 'Mage', rarity: 'A-TIER', counters: ['saber', 'ling'], builds: { 'Global Laser Cannon': ['enchanted_talisman', 'clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'novaria', role: 'Mage', rarity: 'A-TIER', counters: ['radiant_armor'], builds: { 'Sniper Vision Support': ['enchanted_talisman', 'glowing_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'zhuxin', role: 'Mage', rarity: 'S-TIER (META)', counters: ['radiant_armor'], builds: { 'Meta Crowd Control': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'athena_shield', 'dominance_ice', 'winter_crown'] } },
  { id: 'luo-yi', role: 'Mage', rarity: 'A-TIER', counters: ['radiant_armor'], builds: { 'Yin-Yang Teleport Burst': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'zetian', role: 'Mage', rarity: 'A-TIER', counters: ['athena_shield'], builds: { 'Mid Burn Burst': ['clock_of_destiny', 'lightning_truncheon', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },

  // --- TANKS / ROAM ---
  { 
    id: 'tigreal', 
    role: 'Tank', 
    rarity: 'D-TIER',
    counters: ['diggie', 'valir'],
    builds: {
      'Full Defense Roam': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'radiant_armor', 'immortality', 'guardian_helmet']
    }
  },
  { id: 'akai', role: 'Tank', rarity: 'B-TIER', counters: ['valir', 'diggie'], builds: { 'Jungle Pin Tank': ['cursed_helmet', 'guardian_helmet', 'dominance_ice', 'radiant_armor', 'immortality', 'antique_cuirass'] } },
  { id: 'franco', role: 'Tank', rarity: 'A-TIER', counters: ['diggie'], builds: { 'Suppression Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality', 'shadow_mask', 'guardian_helmet'] } },
  { id: 'minotaur', role: 'Tank/Support', rarity: 'S-TIER (META)', counters: ['diggie'], builds: { 'Heal-CC Setup Roam': ['dominance_ice', 'athena_shield', 'oracle', 'antique_cuirass', 'immortality', 'guardian_helmet'] } },
  { id: 'johnson', role: 'Tank', rarity: 'B-TIER', counters: ['diggie'], builds: { 'Mage Crash Build': ['clock_of_destiny', 'genius_wand', 'holy_crystal', 'blade_armor', 'athena_shield', 'immortality'] } },
  { id: 'hilda', role: 'Fighter/Tank', rarity: 'B-TIER', counters: ['karrie'], builds: { 'Bush Invader': ['blade_of_the_heptaseas', 'hunter_strike', 'dominance_ice', 'antique_cuirass', 'athena_shield', 'immortality'] } },
  { id: 'grock', role: 'Tank', rarity: 'A-TIER', counters: ['valir'], builds: { 'Physical Atk Tank': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'antique_cuirass', 'athena_shield', 'immortality'] } },
  { id: 'argus', role: 'Fighter/Tank', rarity: 'B-TIER', counters: ['franco', 'kaja'], builds: { 'Fallen Angel Crit': ['windtalker', 'berserker_fury', 'haas_claws', 'demon_hunter_sword', 'malefic_roar', 'sea_halberd'] } },
  { id: 'hylos', role: 'Tank', rarity: 'S-TIER (META)', counters: ['karrie', 'divine_glaive'], builds: { 'Max HP Clock Frontline': ['clock_of_destiny', 'dominance_ice', 'glowing_wand', 'radiant_armor', 'antique_cuirass', 'immortality'] } },
  { id: 'uranus', role: 'Tank', rarity: 'B-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Regen Core Frontline': ['enchanted_talisman', 'oracle', 'brute_force_breastplate', 'radiant_armor', 'guardian_helmet', 'immortality'] } },
  { id: 'belerick', role: 'Tank', rarity: 'B-TIER', counters: ['griving_wand'], builds: { 'Marksman Taunt Anti-Crit': ['blade_armor', 'dominance_ice', 'cursed_helmet', 'oracle', 'twilight_armor', 'immortality'] } },
  { id: 'khufra', role: 'Tank', rarity: 'A-TIER', counters: ['diggie', 'valir'], builds: { 'Anti-Dash Bounce Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'radiant_armor', 'twilight_armor', 'immortality'] } },
  { id: 'baxia', role: 'Tank', rarity: 'A-TIER', counters: ['karrie', 'divine_glaive'], builds: { 'Anti-Regen Jungle Tank': ['cursed_helmet', 'glowing_wand', 'dominance_ice', 'radiant_armor', 'guardian_helmet', 'immortality'] } },
  { id: 'atlas', role: 'Tank', rarity: 'A-TIER', counters: ['diggie', 'valir'], builds: { 'Kraken Flip CC Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality', 'fleeting_time', 'guardian_helmet'] } },
  { id: 'barats', role: 'Tank/Fighter', rarity: 'A-TIER', counters: ['karrie', 'valir'], builds: { 'Behemoth Jungle Utility': ['war_axe', 'cursed_helmet', 'guardian_helmet', 'dominance_ice', 'athena_shield', 'immortality'] } },
  { id: 'edith', role: 'Tank/Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'masha'], builds: { 'Defense to Attack Convert': ['dominance_ice', 'athena_shield', 'blade_armor', 'holy_crystal', 'feather_of_heaven', 'immortality'] } },
  { id: 'gloo', role: 'Tank', rarity: 'B-TIER', counters: ['baxia'], builds: { 'Split Attachment Frontline': ['cursed_helmet', 'glowing_wand', 'dominance_ice', 'oracle', 'athena_shield', 'immortality'] } },

  // --- SUPPORTS / ROAM ---
  { 
    id: 'angela', 
    role: 'Support', 
    rarity: 'B-TIER',
    counters: ['saber', 'natalia', 'gusion'],
    builds: {
      'Pocket Shield Heal': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'oracle', 'athena_shield', 'immortality']
    }
  },
  { id: 'nana', role: 'Mage/Support', rarity: 'B-TIER', counters: ['athena_shield'], builds: { 'Molina Burst Trap': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'rafaela', role: 'Support', rarity: 'B-TIER', counters: ['baxia'], builds: { 'Speed Buff Roam': ['enchanted_talisman', 'dominance_ice', 'oracle', 'ice_queen_wand', 'athena_shield', 'immortality'] } },
  { id: 'lolita', role: 'Support/Tank', rarity: 'A-TIER', counters: ['diggie'], builds: { 'Shield Guard Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'twilight_armor', 'immortality'] } },
  { id: 'estes', role: 'Support', rarity: 'B-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Font of Life Heal': ['enchanted_talisman', 'oracle', 'dominance_ice', 'immortality', 'athena_shield', 'guardian_helmet'] } },
  { id: 'diggie', role: 'Support', rarity: 'S-TIER (META)', counters: ['natalia', 'saber'], builds: { 'Anti-CC Meta Utility': ['enchanted_talisman', 'fleeting_time', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'carmilla', role: 'Support/Tank', rarity: 'A-TIER', counters: ['baxia'], builds: { 'Link CC Frontline': ['cursed_helmet', 'dominance_ice', 'athena_shield', 'guardian_helmet', 'oracle', 'immortality'] } },
  { id: 'mathilda', role: 'Support/Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'saber'], builds: { 'Wisp Burst Roam': ['enchanted_talisman', 'genius_wand', 'glowing_wand', 'holy_crystal', 'oracle', 'immortality'] } },
  { id: 'floryn', role: 'Support', rarity: 'A-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Global Map Heal': ['enchanted_talisman', 'fleeting_time', 'oracle', 'athena_shield', 'dominance_ice', 'immortality'] } },
  { id: 'faramis', role: 'Mage/Support', rarity: 'S-TIER (META)', counters: ['valentina'], builds: { 'Cult Altar Resurrection': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'lightning_truncheon', 'divine_glaive', 'winter_crown'] } },
  { id: 'kaja', role: 'Support/Fighter', rarity: 'A-TIER', counters: ['diggie'], builds: { 'Suppression Flicker Roam': ['fleeting_time', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'immortality'] } },
  { id: 'chip', role: 'Support/Tank', rarity: 'S-TIER (META)', counters: ['diggie'], builds: { 'Portal Gatherer Tank': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'radiant_armor', 'immortality'] } },
  { id: 'marcel', role: 'Support', rarity: 'A-TIER', counters: ['saber'], builds: { 'Utility Support': ['enchanted_talisman', 'dominance_ice', 'oracle', 'athena_shield', 'antique_cuirass', 'immortality'] } }
];

const MLBB_ITEM_DATA_RAW = [
  // Physical Attack Core Items
  { id: 'sea_halberd',            name: 'Sea Halberd',            type: 'Physical',  tier: 'TIER III' },
  { id: 'rose_gold_meteor',       name: 'Rose Gold Meteor',       type: 'Physical',  tier: 'TIER III' },
  { id: 'bloodlust_axe',          name: 'Bloodlust Axe',          type: 'Physical',  tier: 'TIER III' },
  { id: 'hunter_strike',          name: 'Hunter Strike',          type: 'Physical',  tier: 'TIER III' },
  { id: 'blade_of_despair',       name: 'Blade of Despair',       type: 'Physical',  tier: 'TIER III' },
  { id: 'blade_of_the_heptaseas', name: 'Blade of the Heptaseas', type: 'Physical',  tier: 'TIER III' },
  { id: 'windtalker',             name: 'Windtalker',             type: 'Physical',  tier: 'TIER III' },
  { id: 'endless_battle',         name: 'Endless Battle',         type: 'Physical',  tier: 'TIER III' },
  { id: 'berserker_fury',         name: "Berserker's Fury",       type: 'Physical',  tier: 'TIER III' },
  { id: 'haas_claws',             name: "Haas's Claws",           type: 'Physical',  tier: 'TIER III' },
  { id: 'malefic_roar',           name: 'Malefic Roar',           type: 'Physical',  tier: 'TIER III' },
  { id: 'war_axe',                name: 'War Axe',                type: 'Physical',  tier: 'TIER III' },
  { id: 'wind_of_nature',         name: 'Wind of Nature',         type: 'Physical',  tier: 'TIER III' },
  { id: 'corrosion_scythe',       name: 'Corrosion Scythe',       type: 'Physical',  tier: 'TIER III' },
  { id: 'demon_hunter_sword',     name: 'Demon Hunter Sword',     type: 'Physical',  tier: 'TIER III' },
  { id: 'great_dragon_spear',     name: 'Great Dragon Spear',     type: 'Physical',  tier: 'TIER III' },
  { id: 'golden_staff',           name: 'Golden Staff',           type: 'Physical',  tier: 'TIER III' },
  // Magic Power Items
  { id: 'genius_wand',            name: 'Genius Wand',            type: 'Magic',     tier: 'TIER III' },
  { id: 'lightning_truncheon',    name: 'Lightning Truncheon',    type: 'Magic',     tier: 'TIER III' },
  { id: 'fleeting_time',          name: 'Fleeting Time',          type: 'Magic',     tier: 'TIER III' },
  { id: 'blood_wings',            name: 'Blood Wings',            type: 'Magic',     tier: 'TIER III' },
  { id: 'clock_of_destiny',       name: 'Clock of Destiny',       type: 'Magic',     tier: 'TIER III' },
  { id: 'holy_crystal',           name: 'Holy Crystal',           type: 'Magic',     tier: 'TIER III' },
  { id: 'divine_glaive',          name: 'Divine Glaive',          type: 'Magic',     tier: 'TIER III' },
  { id: 'glowing_wand',           name: 'Glowing Wand',           type: 'Magic',     tier: 'TIER III' },
  { id: 'ice_queen_wand',         name: 'Ice Queen Wand',         type: 'Magic',     tier: 'TIER III' },
  { id: 'feather_of_heaven',      name: 'Feather of Heaven',      type: 'Magic',     tier: 'TIER III' },
  { id: 'star_shard',             name: 'Star Shard',             type: 'Magic',     tier: 'TIER III' },
  { id: 'enchanted_talisman',     name: 'Enchanted Talisman',     type: 'Magic',     tier: 'TIER III' },
  { id: 'winter_crown',           name: 'Winter Crown',           type: 'Magic',     tier: 'TIER III' },
  { id: 'concentrated_energy',    name: 'Concentrated Energy',    type: 'Magic',     tier: 'TIER III' },
  { id: 'calamity_reaper',        name: 'Calamity Reaper',        type: 'Magic',     tier: 'TIER III' },
  // Defense Items
  { id: 'radiant_armor',          name: 'Radiant Armor',          type: 'Defense',   tier: 'TIER III' },
  { id: 'twilight_armor',         name: 'Twilight Armor',         type: 'Defense',   tier: 'TIER III' },
  { id: 'brute_force_breastplate',name: 'Brute Force Breastplate',type: 'Defense',   tier: 'TIER III' },
  { id: 'immortality',            name: 'Immortality',            type: 'Defense',   tier: 'TIER III' },
  { id: 'dominance_ice',          name: 'Dominance Ice',          type: 'Defense',   tier: 'TIER III' },
  { id: 'athena_shield',          name: "Athena's Shield",        type: 'Defense',   tier: 'TIER III' },
  { id: 'oracle',                 name: 'Oracle',                 type: 'Defense',   tier: 'TIER III' },
  { id: 'antique_cuirass',        name: 'Antique Cuirass',        type: 'Defense',   tier: 'TIER III' },
  { id: 'guardian_helmet',        name: 'Guardian Helmet',        type: 'Defense',   tier: 'TIER III' },
  { id: 'blade_armor',            name: 'Blade Armor',            type: 'Defense',   tier: 'TIER III' },
  { id: 'thunder_belt',           name: 'Thunder Belt',           type: 'Defense',   tier: 'TIER III' },
  { id: 'cursed_helmet',          name: 'Cursed Helmet',          type: 'Defense',   tier: 'TIER III' },
  // Movement / Boots
  { id: 'warrior_boots',          name: 'Warrior Boots',          type: 'Movement',  tier: 'TIER I'   },
  { id: 'tough_boots',            name: 'Tough Boots',            type: 'Movement',  tier: 'TIER I'   },
  { id: 'magic_shoes',            name: 'Magic Shoes',            type: 'Movement',  tier: 'TIER I'   },
  { id: 'arcane_boots',           name: 'Arcane Boots',           type: 'Movement',  tier: 'TIER I'   },
  { id: 'rapid_boots',            name: 'Rapid Boots',            type: 'Movement',  tier: 'TIER I'   },
  { id: 'swift_boots',            name: 'Swift Boots',            type: 'Movement',  tier: 'TIER I'   },
];

/* Item images via mobile-legends Fandom wiki CDN (Special:FilePath → CDN redirect).
   mobile-legends.fandom.com has better coverage and no Item_ prefix required.
   Overrides fix apostrophes + lowercase prepositions (of/the/of_the). */
const ITEM_WIKI_OVERRIDES = {
  berserker_fury:          "Berserker%27s_Fury",
  haas_claws:              "Haas%27s_Claws",
  athena_shield:           "Athena%27s_Shield",
  blade_of_despair:        "Blade_of_Despair",
  blade_of_the_heptaseas:  "Blade_of_the_Heptaseas",
  wind_of_nature:          "Wind_of_Nature",
  demon_hunter_sword:      "Demon_Hunter_Sword",
  great_dragon_spear:      "Great_Dragon_Spear",
  clock_of_destiny:        "Clock_of_Destiny",
  ice_queen_wand:          "Ice_Queen_Wand",
  feather_of_heaven:       "Feather_of_Heaven",
  enchanted_talisman:      "Enchanted_Talisman",
  blood_wings:             "Blood_Wings",
  divine_glaive:           "Divine_Glaive",
  glowing_wand:            "Glowing_Wand",
  winter_crown:            "Winter_Crown",
  holy_crystal:            "Holy_Crystal",
  genius_wand:             "Genius_Wand",
  radiant_armor:           "Radiant_Armor",
  twilight_armor:          "Twilight_Armor",
  brute_force_breastplate: "Brute_Force_Breastplate",
  dominance_ice:           "Dominance_Ice",
  antique_cuirass:         "Antique_Cuirass",
  guardian_helmet:         "Guardian_Helmet",
  blade_armor:             "Blade_Armor",
  thunder_belt:            "Thunder_Belt",
  cursed_helmet:           "Cursed_Helmet",
  corrosion_scythe:        "Corrosion_Scythe",
  endless_battle:          "Endless_Battle",
  lightning_truncheon:     "Lightning_Truncheon",
  fleeting_time:           "Fleeting_Time",
  star_shard:              "Star_Shard",
  golden_staff:            "Golden_Staff",
  concentrated_energy:     "Concentrated_Energy",
  calamity_reaper:         "Calamity_Reaper",
  warrior_boots:           "Warrior_Boots",
  tough_boots:             "Tough_Boots",
  magic_shoes:             "Magic_Shoes",
  arcane_boots:            "Arcane_Boots",
  rapid_boots:             "Rapid_Boots",
  swift_boots:             "Swift_Boots",
};

function resolveItemImg(id) {
  const wiki = ITEM_WIKI_OVERRIDES[id]
    || id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
  return `https://mobile-legends.fandom.com/wiki/Special:FilePath/${wiki}.png`;
}

function buildHeroTitleString(id) {
  return id.split(/[-']/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(id.includes('-') ? '-' : "'");
}

function resolveHeroFilename(id) {
  if (id === 'lapu-lapu') return 'Lapu-lapu.png';
  if (id === 'popol') return 'Popol and Kupa.png';
  if (id === 'yu-zhong') return 'Yu Zhong.png';
  if (id === 'x-borg') return 'X-Borg.png';
  return id.charAt(0).toUpperCase() + id.slice(1) + '.png';
}

function resolveHeroImg(id) {
  if (HERO_CDN_IMGS[id]) return HERO_CDN_IMGS[id];
  return `images/heroes/${resolveHeroFilename(id)}`;
}

/* Real hero stats sourced from mlbbhub.com
   dur/off/ctrl/diff = in-game attribute bars (0-100)
   wr/pr/br = win%/pick%/ban% */
const HERO_STATS = {
  // Assassins
  saber:      { tier:'S', wr:51.3, pr:5.2,  br:2.1,  dur:28, off:74, ctrl:56, diff:60  },
  karina:     { tier:'D', wr:49.2, pr:3.1,  br:0.8,  dur:38, off:90, ctrl:32, diff:38  },
  fanny:      { tier:'D', wr:47.8, pr:4.2,  br:8.3,  dur:26, off:84, ctrl:26, diff:100 },
  hayabusa:   { tier:'C', wr:49.1, pr:6.8,  br:3.2,  dur:30, off:78, ctrl:22, diff:80  },
  natalia:    { tier:'B', wr:50.2, pr:2.8,  br:1.5,  dur:36, off:72, ctrl:42, diff:64  },
  lancelot:   { tier:'D', wr:47.8, pr:8.1,  br:5.6,  dur:30, off:84, ctrl:20, diff:90  },
  helcurt:    { tier:'S', wr:51.8, pr:4.2,  br:1.8,  dur:38, off:82, ctrl:42, diff:52  },
  gusion:     { tier:'A', wr:48.4, pr:7.3,  br:6.4,  dur:28, off:90, ctrl:16, diff:92  },
  selena:     { tier:'B', wr:51.2, pr:5.6,  br:4.2,  dur:28, off:86, ctrl:72, diff:88  },
  hanzo:      { tier:'B', wr:49.6, pr:3.5,  br:1.8,  dur:42, off:84, ctrl:28, diff:76  },
  ling:       { tier:'S', wr:51.4, pr:9.2,  br:7.5,  dur:22, off:86, ctrl:18, diff:94  },
  benedetta:  { tier:'A', wr:49.5, pr:5.8,  br:2.6,  dur:28, off:80, ctrl:32, diff:86  },
  aamon:      { tier:'A', wr:51.2, pr:4.1,  br:2.3,  dur:36, off:88, ctrl:14, diff:72  },
  joy:        { tier:'A', wr:50.8, pr:3.8,  br:1.9,  dur:30, off:78, ctrl:20, diff:80  },
  nolan:      { tier:'S', wr:53.2, pr:7.8,  br:9.4,  dur:28, off:84, ctrl:28, diff:82  },
  sora:       { tier:'S', wr:52.1, pr:5.4,  br:3.2,  dur:32, off:82, ctrl:22, diff:78  },
  hirara:     { tier:'A', wr:51.8, pr:4.6,  br:2.8,  dur:26, off:86, ctrl:16, diff:88  },
  // Fighters
  balmond:    { tier:'B', wr:50.5, pr:4.2,  br:1.4,  dur:68, off:68, ctrl:36, diff:22  },
  chou:       { tier:'D', wr:49.2, pr:8.6,  br:6.2,  dur:52, off:72, ctrl:82, diff:84  },
  ruby:       { tier:'A', wr:51.8, pr:5.8,  br:3.1,  dur:60, off:56, ctrl:88, diff:48  },
  'lapu-lapu':{ tier:'C', wr:50.4, pr:6.2,  br:3.8,  dur:72, off:74, ctrl:38, diff:62  },
  alucard:    { tier:'B', wr:50.8, pr:7.4,  br:2.6,  dur:62, off:78, ctrl:28, diff:28  },
  bane:       { tier:'A', wr:51.6, pr:3.1,  br:1.2,  dur:56, off:64, ctrl:32, diff:44  },
  zilong:     { tier:'B', wr:50.4, pr:5.2,  br:2.0,  dur:58, off:72, ctrl:18, diff:28  },
  freya:      { tier:'A', wr:51.4, pr:4.8,  br:2.2,  dur:60, off:76, ctrl:42, diff:42  },
  sun:        { tier:'B', wr:50.8, pr:5.4,  br:2.3,  dur:64, off:70, ctrl:36, diff:32  },
  alpha:      { tier:'A', wr:51.2, pr:4.8,  br:2.0,  dur:66, off:76, ctrl:48, diff:44  },
  roger:      { tier:'S', wr:54.2, pr:12.8, br:14.6, dur:62, off:80, ctrl:36, diff:62  },
  gatotkaca:  { tier:'B', wr:50.4, pr:4.2,  br:2.6,  dur:78, off:54, ctrl:72, diff:56  },
  jawhead:    { tier:'B', wr:51.0, pr:5.6,  br:3.4,  dur:70, off:68, ctrl:72, diff:62  },
  martis:     { tier:'A', wr:51.6, pr:6.8,  br:4.2,  dur:58, off:72, ctrl:82, diff:64  },
  aldous:     { tier:'B', wr:50.6, pr:5.4,  br:3.8,  dur:72, off:78, ctrl:32, diff:48  },
  leomord:    { tier:'B', wr:50.8, pr:5.8,  br:4.2,  dur:64, off:82, ctrl:42, diff:52  },
  thamuz:     { tier:'A', wr:52.4, pr:8.4,  br:5.6,  dur:74, off:78, ctrl:28, diff:44  },
  minsitthar: { tier:'A', wr:51.4, pr:4.8,  br:3.2,  dur:72, off:62, ctrl:80, diff:58  },
  badang:     { tier:'B', wr:50.8, pr:5.2,  br:2.8,  dur:64, off:72, ctrl:68, diff:52  },
  guinevere:  { tier:'A', wr:52.8, pr:8.6,  br:7.4,  dur:54, off:80, ctrl:66, diff:64  },
  terizla:    { tier:'S', wr:52.4, pr:7.6,  br:4.8,  dur:76, off:70, ctrl:56, diff:52  },
  'x-borg':   { tier:'A', wr:51.5, pr:6.4,  br:3.8,  dur:66, off:76, ctrl:38, diff:58  },
  dyrroth:    { tier:'A', wr:52.1, pr:7.2,  br:5.4,  dur:60, off:82, ctrl:36, diff:58  },
  silvanna:   { tier:'B', wr:51.2, pr:6.8,  br:4.6,  dur:62, off:70, ctrl:68, diff:64  },
  'yu-zhong': { tier:'S', wr:52.8, pr:8.4,  br:6.2,  dur:78, off:76, ctrl:52, diff:52  },
  khaleed:    { tier:'B', wr:51.2, pr:5.8,  br:3.4,  dur:70, off:74, ctrl:64, diff:56  },
  paquito:    { tier:'S', wr:54.8, pr:11.6, br:13.2, dur:56, off:82, ctrl:68, diff:72  },
  phoveus:    { tier:'B', wr:51.2, pr:5.4,  br:2.6,  dur:68, off:72, ctrl:56, diff:54  },
  yin:        { tier:'B', wr:51.8, pr:8.2,  br:6.8,  dur:58, off:86, ctrl:28, diff:64  },
  julian:     { tier:'S', wr:52.8, pr:8.4,  br:7.2,  dur:56, off:82, ctrl:48, diff:78  },
  fredrinn:   { tier:'A', wr:51.8, pr:7.6,  br:5.4,  dur:80, off:66, ctrl:74, diff:62  },
  cici:       { tier:'A', wr:51.5, pr:5.8,  br:3.4,  dur:58, off:72, ctrl:42, diff:62  },
  arlott:     { tier:'S', wr:52.5, pr:8.4,  br:6.2,  dur:60, off:78, ctrl:68, diff:68  },
  aulus:      { tier:'B', wr:51.2, pr:5.6,  br:3.2,  dur:68, off:82, ctrl:22, diff:42  },
  masha:      { tier:'A', wr:52.4, pr:6.2,  br:4.8,  dur:88, off:72, ctrl:36, diff:46  },
  suyou:      { tier:'S', wr:53.2, pr:9.4,  br:8.6,  dur:56, off:80, ctrl:54, diff:74  },
  lukas:      { tier:'A', wr:51.4, pr:4.8,  br:2.4,  dur:64, off:74, ctrl:46, diff:56  },
  kalea:      { tier:'A', wr:51.2, pr:4.6,  br:2.2,  dur:66, off:68, ctrl:54, diff:48  },
  // Marksmen
  miya:       { tier:'A', wr:52.5, pr:9.8,  br:2.8,  dur:36, off:78, ctrl:32, diff:26  },
  popol:      { tier:'B', wr:50.8, pr:5.4,  br:2.8,  dur:50, off:74, ctrl:62, diff:56  },
  bruno:      { tier:'A', wr:51.8, pr:6.2,  br:3.4,  dur:38, off:82, ctrl:28, diff:42  },
  clint:      { tier:'A', wr:51.4, pr:5.8,  br:2.6,  dur:36, off:78, ctrl:32, diff:48  },
  layla:      { tier:'B', wr:52.2, pr:10.4, br:3.2,  dur:34, off:76, ctrl:22, diff:20  },
  moskov:     { tier:'S', wr:52.8, pr:8.6,  br:6.4,  dur:36, off:80, ctrl:56, diff:58  },
  karrie:     { tier:'A', wr:52.8, pr:9.8,  br:8.4,  dur:36, off:84, ctrl:26, diff:56  },
  iridhel:    { tier:'B', wr:50.8, pr:4.8,  br:2.6,  dur:44, off:84, ctrl:32, diff:58  },
  hanabi:     { tier:'B', wr:51.2, pr:6.4,  br:3.8,  dur:40, off:76, ctrl:52, diff:52  },
  claude:     { tier:'S', wr:53.8, pr:11.2, br:13.4, dur:44, off:82, ctrl:42, diff:72  },
  kimmy:      { tier:'B', wr:51.0, pr:5.8,  br:3.2,  dur:38, off:80, ctrl:42, diff:66  },
  granger:    { tier:'A', wr:52.1, pr:8.6,  br:6.8,  dur:36, off:88, ctrl:26, diff:76  },
  wanwan:     { tier:'A', wr:53.2, pr:13.6, br:18.4, dur:38, off:80, ctrl:52, diff:76  },
  brody:      { tier:'A', wr:52.1, pr:8.4,  br:6.2,  dur:44, off:84, ctrl:36, diff:62  },
  beatrix:    { tier:'A', wr:50.8, pr:7.2,  br:5.4,  dur:40, off:86, ctrl:28, diff:88  },
  melissa:    { tier:'A', wr:52.5, pr:7.8,  br:5.2,  dur:34, off:76, ctrl:48, diff:64  },
  ixia:       { tier:'S', wr:53.4, pr:8.6,  br:7.2,  dur:38, off:80, ctrl:38, diff:54  },
  natan:      { tier:'S', wr:52.8, pr:7.4,  br:5.8,  dur:36, off:82, ctrl:22, diff:62  },
  lesley:     { tier:'B', wr:51.2, pr:5.6,  br:3.4,  dur:34, off:86, ctrl:18, diff:62  },
  obsidia:    { tier:'A', wr:51.6, pr:5.4,  br:3.2,  dur:38, off:80, ctrl:34, diff:58  },
  // Mages
  alice:      { tier:'B', wr:51.2, pr:4.6,  br:2.8,  dur:68, off:74, ctrl:52, diff:48  },
  eudora:     { tier:'B', wr:51.2, pr:4.8,  br:2.4,  dur:32, off:92, ctrl:72, diff:22  },
  gord:       { tier:'B', wr:50.4, pr:3.2,  br:1.4,  dur:36, off:90, ctrl:52, diff:54  },
  kagura:     { tier:'A', wr:50.8, pr:5.6,  br:4.2,  dur:34, off:90, ctrl:76, diff:92  },
  cyclops:    { tier:'B', wr:51.4, pr:5.4,  br:3.6,  dur:38, off:86, ctrl:62, diff:62  },
  aurora:     { tier:'A', wr:51.2, pr:4.2,  br:2.8,  dur:34, off:90, ctrl:84, diff:58  },
  vexana:     { tier:'S', wr:52.4, pr:6.8,  br:5.2,  dur:38, off:86, ctrl:64, diff:62  },
  harley:     { tier:'B', wr:50.6, pr:5.2,  br:3.4,  dur:36, off:88, ctrl:42, diff:68  },
  odette:     { tier:'A', wr:51.5, pr:4.8,  br:2.8,  dur:38, off:86, ctrl:72, diff:54  },
  zhask:      { tier:'S', wr:52.8, pr:7.4,  br:6.2,  dur:36, off:88, ctrl:42, diff:62  },
  pharsa:     { tier:'B', wr:51.6, pr:5.8,  br:3.4,  dur:36, off:88, ctrl:64, diff:56  },
  valir:      { tier:'B', wr:51.4, pr:4.8,  br:2.6,  dur:42, off:80, ctrl:66, diff:52  },
  'chang-e':  { tier:'B', wr:51.8, pr:5.4,  br:3.2,  dur:36, off:88, ctrl:42, diff:46  },
  vale:       { tier:'B', wr:51.4, pr:5.8,  br:3.6,  dur:36, off:86, ctrl:78, diff:66  },
  lunox:      { tier:'S', wr:52.4, pr:6.8,  br:5.2,  dur:42, off:88, ctrl:56, diff:78  },
  harith:     { tier:'S', wr:52.1, pr:9.2,  br:8.4,  dur:44, off:84, ctrl:52, diff:72  },
  kadita:     { tier:'A', wr:51.4, pr:5.2,  br:3.2,  dur:42, off:86, ctrl:68, diff:64  },
  esmeralda:  { tier:'A', wr:51.6, pr:6.4,  br:4.8,  dur:76, off:68, ctrl:62, diff:58  },
  lylia:      { tier:'A', wr:51.6, pr:5.8,  br:3.4,  dur:40, off:86, ctrl:52, diff:64  },
  cecilision: { tier:'B', wr:51.2, pr:4.4,  br:2.6,  dur:36, off:90, ctrl:56, diff:62  },
  yve:        { tier:'B', wr:51.4, pr:5.8,  br:3.6,  dur:38, off:84, ctrl:76, diff:64  },
  valentina:  { tier:'S', wr:52.8, pr:8.2,  br:7.4,  dur:44, off:82, ctrl:66, diff:76  },
  xavier:     { tier:'A', wr:52.2, pr:9.4,  br:8.2,  dur:44, off:88, ctrl:52, diff:72  },
  novaria:    { tier:'A', wr:51.8, pr:6.8,  br:4.8,  dur:40, off:86, ctrl:62, diff:68  },
  zhuxin:     { tier:'S', wr:53.4, pr:8.6,  br:7.2,  dur:46, off:82, ctrl:72, diff:66  },
  'luo-yi':   { tier:'A', wr:51.6, pr:5.8,  br:4.2,  dur:36, off:88, ctrl:68, diff:72  },
  zetian:     { tier:'A', wr:51.4, pr:5.4,  br:3.8,  dur:38, off:84, ctrl:64, diff:58  },
  // Tanks
  tigreal:    { tier:'D', wr:49.8, pr:8.4,  br:3.2,  dur:90, off:42, ctrl:86, diff:28  },
  akai:       { tier:'B', wr:51.2, pr:5.2,  br:2.4,  dur:88, off:46, ctrl:84, diff:32  },
  franco:     { tier:'A', wr:51.2, pr:6.1,  br:4.8,  dur:84, off:54, ctrl:88, diff:52  },
  minotaur:   { tier:'S', wr:52.4, pr:6.8,  br:4.6,  dur:82, off:56, ctrl:78, diff:42  },
  johnson:    { tier:'B', wr:50.6, pr:5.8,  br:4.2,  dur:86, off:48, ctrl:84, diff:46  },
  hilda:      { tier:'B', wr:50.8, pr:4.6,  br:2.2,  dur:76, off:68, ctrl:46, diff:38  },
  grock:      { tier:'A', wr:51.4, pr:3.2,  br:1.5,  dur:88, off:62, ctrl:76, diff:56  },
  argus:      { tier:'B', wr:50.4, pr:4.2,  br:2.0,  dur:68, off:74, ctrl:28, diff:48  },
  hylos:      { tier:'S', wr:52.8, pr:7.4,  br:5.6,  dur:92, off:44, ctrl:82, diff:36  },
  uranus:     { tier:'B', wr:51.4, pr:5.6,  br:2.8,  dur:92, off:52, ctrl:64, diff:38  },
  belerick:   { tier:'B', wr:50.4, pr:2.9,  br:1.2,  dur:90, off:46, ctrl:74, diff:34  },
  khufra:     { tier:'A', wr:52.8, pr:11.2, br:12.4, dur:88, off:56, ctrl:84, diff:44  },
  baxia:      { tier:'A', wr:51.6, pr:4.2,  br:2.1,  dur:86, off:54, ctrl:72, diff:44  },
  atlas:      { tier:'A', wr:51.8, pr:7.8,  br:6.2,  dur:86, off:46, ctrl:88, diff:52  },
  barats:     { tier:'A', wr:51.6, pr:6.2,  br:3.8,  dur:74, off:68, ctrl:58, diff:62  },
  edith:      { tier:'S', wr:52.8, pr:8.6,  br:7.4,  dur:76, off:62, ctrl:68, diff:64  },
  gloo:       { tier:'B', wr:50.8, pr:5.2,  br:2.8,  dur:84, off:58, ctrl:68, diff:64  },
  // Supports
  angela:     { tier:'B', wr:53.4, pr:12.4, br:16.8, dur:50, off:46, ctrl:68, diff:56  },
  nana:       { tier:'B', wr:52.2, pr:6.8,  br:5.2,  dur:42, off:72, ctrl:72, diff:36  },
  rafaela:    { tier:'B', wr:51.2, pr:4.2,  br:2.6,  dur:52, off:50, ctrl:64, diff:38  },
  lolita:     { tier:'A', wr:52.4, pr:4.5,  br:3.1,  dur:84, off:44, ctrl:80, diff:52  },
  estes:      { tier:'B', wr:50.8, pr:3.8,  br:2.4,  dur:54, off:36, ctrl:68, diff:46  },
  diggie:     { tier:'S', wr:52.8, pr:8.6,  br:9.4,  dur:46, off:40, ctrl:76, diff:52  },
  carmilla:   { tier:'A', wr:51.4, pr:4.8,  br:2.4,  dur:72, off:58, ctrl:78, diff:66  },
  mathilda:   { tier:'S', wr:52.8, pr:8.2,  br:6.8,  dur:46, off:74, ctrl:72, diff:72  },
  floryn:     { tier:'A', wr:52.4, pr:6.8,  br:4.2,  dur:48, off:56, ctrl:48, diff:46  },
  faramis:    { tier:'S', wr:52.4, pr:7.2,  br:5.8,  dur:52, off:76, ctrl:62, diff:58  },
  kaja:       { tier:'A', wr:51.6, pr:5.4,  br:3.2,  dur:58, off:56, ctrl:78, diff:52  },
  chip:       { tier:'S', wr:53.4, pr:6.8,  br:5.2,  dur:76, off:44, ctrl:82, diff:58  },
  marcel:     { tier:'A', wr:51.2, pr:4.2,  br:2.4,  dur:52, off:48, ctrl:66, diff:46  },
};

function rarityToTier(rarity) {
  if (!rarity) return null;
  const m = rarity.match(/^([A-Z](?:\+)?)-TIER/);
  return m ? m[1] : null;
}

function roleToLane(role) {
  if (role === 'Assassin') return 'Jungle';
  if (role === 'Fighter') return 'Exp Lane';
  if (role === 'Mage') return 'Mid Lane';
  if (role === 'Marksman') return 'Gold Lane';
  if (role === 'Tank') return 'Roam';
  if (role === 'Support') return 'Roam';
  return 'Flex';
}

const GameHubData = {
  heroes: MLBB_HERO_DATA_RAW.map(h => {
    const s = HERO_STATS[h.id] || {};
    const tier = s.tier || rarityToTier(h.rarity);
    return {
      id: h.id,
      name: h.name || buildHeroTitleString(h.id),
      role: Array.isArray(h.role) ? h.role[0] : h.role,
      rarity: tier ? `${tier}-TIER${tier === 'S' ? ' (META)' : ''}` : h.rarity,
      tier,
      lane: h.lane || roleToLane(Array.isArray(h.role) ? h.role[0] : h.role),
      img: resolveHeroImg(h.id),
      counters: h.counters || [],
      builds: h.builds || {},
      winRate: s.wr,
      pickRate: s.pr,
      banRate: s.br,
      durability: s.dur,
      offense: s.off,
      control: s.ctrl,
      difficulty: s.diff,
      weakAgainst: s.weak || [],
      strongAgainst: s.strong || [],
      desc: h.desc || `Battlefield tactical asset database log parsing parameters for registry unit [${h.id.toUpperCase()}].`
    };
  }),
  items: MLBB_ITEM_DATA_RAW.map(i => ({
    id: i.id,
    name: i.name,
    type: i.type,
    tier: i.tier,
    img: resolveItemImg(i.id),
    desc: `Core equipment asset: ${i.name} — ${i.type} tier upgrade item.`
  }))
};
