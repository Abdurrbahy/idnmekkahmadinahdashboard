import type { QuranRubricConfig } from '../types/quranRubric'

export const QURAN_RUBRIC_VERSION = '1.0'

export const DEFAULT_QURAN_RUBRIC_CONFIG: QuranRubricConfig = {
  version: QURAN_RUBRIC_VERSION,
  aspectOrder: ['hafalan', 'tajwid', 'makhraj', 'kelancaran', 'waqaf_ibtida'],
  aspects: {
    hafalan: {
      key: 'hafalan',
      name: 'Ketepatan Hafalan',
      shortLabel: 'Hafalan',
      weight: 45,
      description: 'Menilai ketepatan lafaz, urutan ayat, kelengkapan ayat, dan kemampuan self-correction saat salah.',
      descriptors: {
        4: {
          score: 4,
          label: 'Sangat Baik (Mutqin)',
          description:
            'Hafalan sangat mutqin dan kokoh. Seluruh lafaz dan urutan ayat tepat tanpa ada kesalahan, atau langsung membetulkan sendiri tanpa bantuan pancingan penguji.',
        },
        3: {
          score: 3,
          label: 'Baik',
          description:
            'Hafalan baik dengan sedikit keraguan minor (1–2 kali) atau salah harakat/lafaz ringan yang dapat langsung diperbaiki sendiri dengan sedikit jeda.',
        },
        2: {
          score: 2,
          label: 'Cukup',
          description:
            'Terdapat beberapa kesalahan lafaz, ayat terlewat, atau urutan ayat tertukar yang membutuhkan pancingan kata (fath) dari penguji (1–2 kali bantuan).',
        },
        1: {
          score: 1,
          label: 'Kurang',
          description:
            'Sering lupa ayat, tertukar susunan kalimat berulang kali, dan membutuhkan bantuan/pancingan intensif dari penguji (> 2 kali bantuan) untuk melanjutkan.',
        },
        0: {
          score: 0,
          label: 'Belum Menguasai',
          description:
            'Terhenti total dan tidak mampu melanjutkan sebagian besar hafalan pada rentang yang diujikan meskipun telah dibimbing berkali-kali.',
        },
      },
    },
    tajwid: {
      key: 'tajwid',
      name: 'Hukum Tajwid',
      shortLabel: 'Tajwid',
      weight: 25,
      description: 'Menilai ketepatan penerapan hukum tajwid (ghunnah, mad, idgham, ikhfa, iqlab, qalqalah).',
      descriptors: {
        4: {
          score: 4,
          label: 'Sangat Baik',
          description:
            'Penerapan seluruh hukum tajwid sangat tepat, konsisten, dan alami sepanjang bacaan (kadar mad pas, ghunnah sempurna, ikhfa/idgham rapi).',
        },
        3: {
          score: 3,
          label: 'Baik',
          description:
            'Penerapan tajwid secara umum baik dan benar; hanya terdapat kekurangan minor yang tidak berulang (misal kadar mad sesekali sedikit lebih panjang/pendek).',
        },
        2: {
          score: 2,
          label: 'Cukup',
          description:
            'Sebagian hukum tajwid utama diterapkan, namun masih sering terjadi ketidakkonsistenan pada hukum nun/mim mati, ghunnah kurang lama, atau qalqalah tertahan.',
        },
        1: {
          score: 1,
          label: 'Kurang',
          description:
            'Banyak pelanggaran hukum tajwid dasar secara berulang; ghunnah dan mad sering terlewatkan atau tidak dibedakan dengan jelas.',
        },
        0: {
          score: 0,
          label: 'Belum Menguasai',
          description:
            'Belum menguasai kaidah tajwid dasar; membaca Al-Qur\'an tanpa mempraktikkan hukum tajwid yang wajib.',
        },
      },
    },
    makhraj: {
      key: 'makhraj',
      name: 'Makhraj & Sifat Huruf',
      shortLabel: 'Makhraj',
      weight: 15,
      description: 'Menilai ketepatan tempat keluar huruf (makharijul huruf) serta sifat-sifat huruf hijaiyah.',
      descriptors: {
        4: {
          score: 4,
          label: 'Sangat Baik (Fasih)',
          description:
            'Artikulasi seluruh huruf sangat fasih, jelas, dan presisi sesuai makhraj dan sifatnya (hams, jahr, isti\'la, tafkhim/tarqiq konsisten).',
        },
        3: {
          score: 3,
          label: 'Baik',
          description:
            'Pengucapan huruf baik dan fasih; hanya ada ketidaksempurnaan kecil pada huruf-huruf tertentu yang tidak sampai mengubah esensi huruf maupun arti kata.',
        },
        2: {
          score: 2,
          label: 'Cukup',
          description:
            'Pengucapan huruf cukup jelas, namun beberapa huruf hijaiyah berdekatan masih sering tertukar makhrajnya (seperti ha/kha, \'ain/hamzah, shad/sin, dzal/za).',
        },
        1: {
          score: 1,
          label: 'Kurang',
          description:
            'Pelafalan banyak huruf masih terpengaruh dialek lokal/latin; sifat huruf tebal/tipis sering terbalik dan makhraj sering meleset.',
        },
        0: {
          score: 0,
          label: 'Belum Menguasai',
          description:
            'Artikulasi huruf hijaiyah sangat lemah; sebagian besar huruf tidak dikeluarkan dari makhraj yang benar.',
        },
      },
    },
    kelancaran: {
      key: 'kelancaran',
      name: 'Kelancaran & Ritme',
      shortLabel: 'Kelancaran',
      weight: 10,
      description: 'Menilai kontinuitas bacaan, stabilitas tempo tartil, serta tidak adanya keraguan/hambatan.',
      descriptors: {
        4: {
          score: 4,
          label: 'Sangat Baik',
          description:
            'Bacaan mengalir sangat lancar dengan tempo tartil yang stabil dan tenang, tanpa ada jeda keraguan atau pengulangan yang canggung.',
        },
        3: {
          score: 3,
          label: 'Baik',
          description:
            'Bacaan lancar secara konsisten; terdapat sedikit jeda berpikir sesaat namun ritme bacaan cepat pulih tanpa mengganggu alur.',
        },
        2: {
          score: 2,
          label: 'Cukup',
          description:
            'Tempo bacaan agak tersendat di beberapa titik; terdapat pengulangan potongan ayat (ta\'tsir) atau jeda ragu saat mengingat kelanjutan.',
        },
        1: {
          score: 1,
          label: 'Kurang',
          description:
            'Sering terhenti lama dan ritme bacaan terputus-putus; keraguan mendominasi sebagian besar sesi ujian.',
        },
        0: {
          score: 0,
          label: 'Belum Menguasai',
          description:
            'Tidak lancar sama sekali; bacaan sangat terputus-putus dan tidak mampu mempertahankan alur bacaan.',
        },
      },
    },
    waqaf_ibtida: {
      key: 'waqaf_ibtida',
      name: 'Waqaf & Ibtida',
      shortLabel: 'Waqaf',
      weight: 5,
      description: 'Menilai ketepatan berhenti (waqaf) dan memulai kembali (ibtida) sesuai makna dan kaidah ayat.',
      descriptors: {
        4: {
          score: 4,
          label: 'Sangat Baik',
          description:
            'Selalu berhenti pada tanda waqaf atau tempat yang tepat (waqaf tam/kafi), serta memulai kembali bacaan dengan menjaga keutuhan makna ayat.',
        },
        3: {
          score: 3,
          label: 'Baik',
          description:
            'Pemilihan waqaf dan ibtida tepat; jika nafas habis di tengah ayat, mampu mengulang dari kata yang sesuai tanpa merusak struktur makna.',
        },
        2: {
          score: 2,
          label: 'Cukup',
          description:
            'Kadang berhenti di tempat yang kurang sempurna (waqaf hasan), namun segera membetulkan saat mengulang kembali bacaan.',
        },
        1: {
          score: 1,
          label: 'Kurang',
          description:
            'Sering berhenti sembarangan di tengah susunan kata (waqaf qabih) atau memulai dari kata yang merusak makna kalimat.',
        },
        0: {
          score: 0,
          label: 'Belum Menguasai',
          description:
            'Belum memahami kaidah berhenti dan memulai bacaan; waqaf dan ibtida dilakukan acak tanpa memperhatikan makna kalimat.',
        },
      },
    },
  },
  predicates: [
    { grade: 'A', minScore: 90, maxScore: 100, label: 'Sangat Baik (Mumtaz)' },
    { grade: 'B', minScore: 80, maxScore: 89.99, label: 'Baik (Jayyid Jiddan)' },
    { grade: 'C', minScore: 70, maxScore: 79.99, label: 'Cukup (Jayyid)' },
    { grade: 'D', minScore: 0, maxScore: 69.99, label: 'Kurang (Dhaif)' },
  ],
  statusRules: {
    lancar: {
      minNilaiAkhir: 85,
      minSkorHafalan: 3,
    },
    kurang: {
      minNilaiAkhir: 70,
      maxNilaiAkhir: 85,
    },
    ulang: {
      maxNilaiAkhir: 70,
      mandatoryFailConditions: [
        {
          aspect: 'hafalan',
          failScore: 0,
        },
      ],
    },
  },
}
