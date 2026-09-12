/* Texte der statischen Kategorieseiten.
   Diese Datei ist die einzige Stelle, an der Seitentexte gepflegt werden —
   Quellen/build-seiten.mjs erzeugt daraus website/<slug>.html.

   WICHTIG: Die Pfade (slug) entsprechen exakt den URLs der alten Contao-Seite.
   Sie dürfen nicht geändert werden, sonst gehen die vorhandenen Google-
   Platzierungen und alle Verlinkungen von außen verloren.

   de/en: Ausgeliefert wird immer Deutsch (Suchmaschinen indexieren Deutsch).
   Der englische Text wird erst auf Klick des Sprachumschalters eingesetzt. */

export const SITE = {
  name: "Walter Pepperle",
  role: "Illustration & Graphic Design",
  origin: "https://www.pepperle.de",
  street: "Untermainkai 1",
  zip: "60311",
  city: "Frankfurt am Main",
  country: "DE",
  phone: "+49 171 1963147",
  /* Bewusst zusammengesetzt: diese Datei liegt als Bauquelle öffentlich unter
     website/Quellen/ — ausgeschrieben fänden Adress-Sammler sie dort. */
  email: "info" + "@" + "pepperle.de",
  /* Für die strukturierten Daten der Startseite. Standen bis zur
     Sprachumstellung fest im handgepflegten website/index.html — jetzt hier,
     weil die Startseite in fünf Sprachen erzeugt wird. Bewusst NICHT
     übersetzt: Berufsbezeichnung und Fachgebiete sind Angaben zur Person,
     Google wertet sie sprachunabhängig aus. */
  jobTitle: "Illustrator, Grafik-Designer und Packungsdesigner",
  knowsAbout: [
    "Fotorealistische Illustration",
    "Packungsdesign",
    "Verpackungsdesign",
    "Verpackungsgestaltung",
    "Airbrush",
    "Handlettering",
    "Logoentwicklung",
    "Logodesign",
    "Grafikdesign",
    "Technische Illustration",
    "Medizinische Illustration"
  ]
};

/* Reihenfolge = Reihenfolge in der Fußnavigation und in der Sitemap */
export const PAGES = [
  {
    cat: "food",
    slug: "food-drinks",
    de: {
      title: "Food & Drinks — fotorealistische Illustration von Lebensmitteln",
      h1: "Food & Drinks",
      description:
        "Fotorealistische Food-Illustration von Walter Pepperle: Früchte, Schokolade, Kaffee und Getränke für Verpackung, Anzeige und Plakat — Illustrator und Grafikdesigner aus Frankfurt am Main.",
      intro: [
        "Appetitliche Lebensmittel entstehen auf der Verpackung selten vor der Kamera. Wo ein Foto an seine Grenzen kommt — bei aufgeschnittenen Früchten, fließender Schokolade, dem perfekten Spritzer im Glas — übernimmt die Illustration. Sie zeigt das Produkt so, wie es aussehen soll: sauber, verführerisch und in jeder Auflage identisch reproduzierbar.",
        "Die Arbeiten dieser Kategorie reichen von einzelnen Fruchtabbildungen über Kaffee- und Milchmotive bis zu vollständigen Packungsbildern für Konfitüre, Riegel und Getränke. Gearbeitet wird fotorealistisch, in Airbrush-Technik und digital — je nachdem, was das Motiv und der Druckprozess verlangen."
      ],
      keywords:
        "Food-Illustration, Lebensmittel Illustration, Fruchtabbildungen, Verpackungsillustration, Airbrush, fotorealistisch"
    },
    en: {
      h1: "Food & Drinks",
      intro: [
        "Appetising food rarely happens in front of a camera. Where photography reaches its limits — cut fruit, flowing chocolate, the perfect splash in a glass — illustration takes over. It shows the product exactly as it should look: clean, tempting and identically reproducible in every print run.",
        "This category ranges from individual fruit renderings through coffee and milk motifs to complete pack shots for preserves, bars and beverages. Executed photorealistically, in airbrush and digitally — whichever the subject and the printing process call for."
      ]
    }
  },
  {
    cat: "transport",
    slug: "transportation-technology",
    de: {
      altKind: "technische Illustration",
      title: "Verkehr & Technik — technische Illustration und Fahrzeugmotive",
      h1: "Verkehr & Technik",
      description:
        "Technische Illustration von Walter Pepperle: Automobile, Motorräder, Schienenfahrzeuge sowie Maschinen- und Anlagendarstellungen für Werbung und Technikdokumentation — Illustrator aus Frankfurt am Main.",
      intro: [
        "Technik zeigt sich in der Illustration von ihrer besten Seite: Lack ohne Spiegelungen der Umgebung, Schnittdarstellungen, die kein Foto liefern kann, und Perspektiven, für die es das Objekt noch gar nicht gibt.",
        "Die Motive umfassen klassische und aktuelle Automobile, Motorräder, Schienenfahrzeuge sowie technische Darstellungen von Maschinen, Anlagen und Bauteilen — vom Werbemotiv bis zur erklärenden Explosionszeichnung."
      ],
      keywords:
        "technische Illustration, Fahrzeugillustration, Automobil Illustration, Explosionszeichnung, Airbrush, Industrieillustration"
    },
    en: {
      h1: "Transportation & Technology",
      intro: [
        "Technology shows its best side in illustration: paintwork without reflections of the surroundings, cutaway views no photograph can deliver, and perspectives of objects that do not yet exist.",
        "Subjects include classic and current automobiles, motorcycles and rail vehicles as well as technical renderings of machines, plant and components — from the advertising motif to the explanatory exploded view."
      ]
    }
  },
  {
    cat: "landscape",
    slug: "landscape-scenery",
    de: {
      title: "Landschaft & Szenerie — illustrierte Schauplätze und Stimmungen",
      h1: "Landschaft & Szenerie",
      description:
        "Illustrierte Landschaften und Szenerien von Walter Pepperle: Reise-, Natur- und Architekturmotive sowie erzählende Bildwelten für Werbung und Verpackung — Illustrator aus Frankfurt am Main.",
      intro: [
        "Eine Szenerie muss eine Stimmung transportieren, bevor sie gelesen wird. Illustrierte Landschaften erlauben genau das: Licht, Jahreszeit und Blickwinkel lassen sich frei setzen, und alles Störende bleibt einfach weg.",
        "Die Arbeiten reichen von Reise- und Naturmotiven über Architektur und Innenräume bis zu erzählenden Bildwelten — Schauplätze, die für Verpackungen, Plakate und Anzeigen eine ganze Geschichte in einem Bild unterbringen."
      ],
      keywords:
        "Landschaftsillustration, Szenerie, Architekturillustration, Reisemotive, Bildwelten, Werbeillustration"
    },
    en: {
      h1: "Landscape & Scenery",
      intro: [
        "A scene has to carry a mood before it is read. Illustrated landscapes allow exactly that: light, season and viewpoint can be set freely, and anything distracting simply stays out.",
        "The work ranges from travel and nature motifs through architecture and interiors to narrative image worlds — settings that fit an entire story into a single picture for packaging, posters and advertisements."
      ]
    }
  },
  {
    cat: "people",
    slug: "people-animals",
    de: {
      title: "Menschen & Tiere — Figur, Porträt und Charakter-Illustration",
      h1: "Menschen & Tiere",
      description:
        "Figürliche Illustration von Walter Pepperle: Porträts, Charaktere und Tiermotive für Werbung, Verpackung und Markenauftritte — Illustrator aus Frankfurt am Main.",
      intro: [
        "Figürliche Motive entscheiden sich an wenigen Millimetern — am Blick, an der Haltung, am Ausdruck. Die Illustration hat hier den Vorteil, dass sich Charakter gezielt aufbauen lässt, statt ihn im richtigen Moment einfangen zu müssen.",
        "Diese Kategorie versammelt realistische Figuren und Porträts ebenso wie überzeichnete Charaktere und Tiermotive — von der Bildmarke bis zur Hauptfigur einer Kampagne."
      ],
      keywords:
        "figürliche Illustration, Porträt Illustration, Charakterdesign, Tierillustration, Bildmarke, Werbefigur"
    },
    en: {
      h1: "People & Animals",
      intro: [
        "Figurative motifs are decided by a few millimetres — the gaze, the posture, the expression. Illustration has the advantage that character can be built deliberately instead of having to be caught at the right moment.",
        "This category brings together realistic figures and portraits as well as exaggerated characters and animal motifs — from the pictorial mark to the leading figure of a campaign."
      ]
    }
  },
  {
    cat: "items",
    slug: "realistic-items",
    de: {
      title: "Objekte — realistische Produkt- und Sachillustration",
      h1: "Objekte",
      description:
        "Realistische Objekt- und Produktillustration von Walter Pepperle: Materialien, Oberflächen und Gegenstände in fotorealistischer Darstellung — Illustrator aus Frankfurt am Main.",
      intro: [
        "Glas, Edelstahl, Flüssigkeit, gebürstetes Metall: Objektillustration ist zu einem großen Teil Materialdarstellung. Wie eine Oberfläche das Licht behandelt, entscheidet darüber, ob ein Gegenstand echt wirkt.",
        "Die Arbeiten dieser Kategorie zeigen einzelne Produkte und Sachmotive in fotorealistischer Ausführung — freigestellt, in Szene gesetzt oder als erklärende Darstellung technischer Zusammenhänge."
      ],
      keywords:
        "Produktillustration, Objektillustration, Sachillustration, Materialdarstellung, fotorealistisch, Airbrush"
    },
    en: {
      h1: "Realistic Items",
      intro: [
        "Glass, stainless steel, liquid, brushed metal: object illustration is to a large extent the depiction of material. How a surface handles light decides whether an object reads as real.",
        "This category shows individual products and objects in photorealistic execution — cut out, staged, or as an explanatory rendering of technical relationships."
      ]
    }
  },
  {
    cat: "poster",
    slug: "poster-ads",
    de: {
      altKind: "Plakatmotiv",
      title: "Poster & Anzeigen — Plakatillustration und Werbemotive",
      h1: "Poster & Anzeigen",
      description:
        "Plakat- und Anzeigenillustration von Walter Pepperle: Werbemotive, Veranstaltungsplakate und Titelbilder für Print und Außenwerbung — Illustrator aus Frankfurt am Main.",
      intro: [
        "Ein Plakat hat wenige Sekunden. Es muss aus der Entfernung wirken, aus der Nähe standhalten und im Kopf bleiben — Anforderungen, die ein einzelnes starkes Bildmotiv besser erfüllt als jede Aufzählung von Argumenten.",
        "Diese Kategorie versammelt Motive für Anzeigen, Veranstaltungsplakate, Titelbilder und Kampagnen — Arbeiten, die als Hauptmotiv eines Auftritts konzipiert wurden."
      ],
      keywords:
        "Plakatillustration, Anzeigenmotiv, Werbeillustration, Poster Design, Kampagnenmotiv, Titelbild"
    },
    en: {
      h1: "Poster & Ads",
      intro: [
        "A poster has a few seconds. It has to work from a distance, hold up close and stay in the mind — demands that a single strong image meets better than any list of arguments.",
        "This category gathers motifs for advertisements, event posters, cover images and campaigns — work conceived as the lead visual of an appearance."
      ]
    }
  },
  {
    cat: "pharma",
    slug: "pharma-medical",
    de: {
      altKind: "medizinische Illustration",
      title: "Pharma & Medizin — medizinische und wissenschaftliche Illustration",
      h1: "Pharma & Medizin",
      description:
        "Medizinische Illustration von Walter Pepperle: Anatomie, Zellvorgänge, Wirkmechanismen und Molekülgrafiken für Pharma-Kommunikation und Fachpublikationen — Illustrator aus Frankfurt am Main.",
      intro: [
        "In der Pharma-Kommunikation muss ein Bild zwei Dinge gleichzeitig leisten: fachlich korrekt sein und für den Betrachter sofort verständlich. Vorgänge im Körper sind nicht fotografierbar — sie müssen gezeichnet werden, und zwar so, dass die Aussage stimmt.",
        "Die Motive umfassen anatomische Darstellungen, Zell- und Gerinnungsvorgänge, Wirkmechanismen und Molekülgrafiken — erarbeitet in enger Abstimmung mit den fachlichen Vorgaben des Auftraggebers."
      ],
      keywords:
        "medizinische Illustration, Pharma Illustration, Anatomie Illustration, wissenschaftliche Illustration, Wirkmechanismus, Molekülgrafik"
    },
    en: {
      h1: "Pharma & Medical",
      intro: [
        "In pharmaceutical communication an image has to do two things at once: be technically correct and immediately understandable. Processes inside the body cannot be photographed — they have to be drawn, and drawn so that the statement holds.",
        "Subjects include anatomical renderings, cellular and coagulation processes, mechanisms of action and molecular graphics — developed in close coordination with the client's technical requirements."
      ]
    }
  },
  {
    cat: "logos",
    slug: "logos-icons",
    de: {
      altKind: "Logo",
      title: "Logos & Icons — Bildmarken, Schriftzüge und Handlettering, Frankfurt",
      h1: "Logos & Icons",
      description:
        "Logodesign und Schriftzugentwicklung von Walter Pepperle: Bildmarken, Handlettering und Icons für Marken, Produkte und Verpackungen — aus Frankfurt am Main.",
      intro: [
        "Eine Bildmarke muss auf dem Messestand ebenso funktionieren wie geprägt auf einem Deckel von vier Zentimetern Durchmesser. Diese Spannweite entscheidet über jede Linie im Entwurf.",
        "Die Arbeiten reichen von Bildmarken und Icons über gezeichnete Schriftzüge und Handlettering bis zu vollständigen Markenzeichen — häufig entstanden im Zusammenhang mit der Verpackung, für die sie gedacht waren."
      ],
      keywords:
        "Logo Design, Bildmarke, Schriftzug, Handlettering, Logoentwicklung, Icon Design, Markendesign"
    },
    en: {
      h1: "Logos & Icons",
      intro: [
        "A pictorial mark has to work on the trade fair stand just as well as embossed on a four-centimetre lid. That range decides every line in the design.",
        "The work ranges from pictorial marks and icons through drawn lettering and hand lettering to complete trademarks — often created in the context of the packaging they were intended for."
      ]
    }
  },
  {
    cat: "packaging",
    slug: "packaging-display",
    de: {
      altKind: "Packungsdesign",
      title: "Packungsdesign & Display — Verpackungsgestaltung aus Frankfurt",
      h1: "Verpackung & Display",
      description:
        "Packungsdesign & Verpackungsdesign von Walter Pepperle, Packungsdesigner aus Frankfurt am Main: Verpackungsgestaltung, Etiketten und Displays — vom Illustrationsmotiv bis zur druckfertigen Packung.",
      intro: [
        "Verpackungsdesign ist der Ort, an dem sich Illustration und Gestaltung nicht trennen lassen. Das Motiv, die Typografie, die Anordnung der Pflichtangaben und die Wirkung im Regal entstehen als eine Aufgabe — und werden am Ende von einem Druckverfahren begrenzt, das von Anfang an mitgedacht sein will.",
        "Diese Kategorie zeigt vollständige Packungen, Etiketten, Faltschachteln und Displays: Arbeiten, bei denen das eigene Illustrationsmotiv und der Entwurf der Packung aus einer Hand kommen — bis zur druckfertigen Reinzeichnung."
      ],
      keywords:
        "Packungsdesign, Verpackungsdesign, Verpackungsgestaltung, Display Design, Etikettendesign, Faltschachtel, Frankfurt"
    },
    en: {
      h1: "Packaging & Display",
      intro: [
        "Packaging is where illustration and design cannot be separated. The motif, the typography, the placement of mandatory information and the effect on the shelf emerge as one task — and are ultimately constrained by a printing process that has to be considered from the start.",
        "This category shows complete packs, labels, folding cartons and displays: work in which the illustration and the design of the pack come from one hand — through to print-ready artwork."
      ]
    }
  }
];

/* Texte, die auf allen Seiten gleich sind */
export const COMMON = {
  de: {
    backHome: "Zur Startseite",
    contact: "Kontakt",
    otherCats: "Weitere Arbeiten",
    imprint: "Impressum",
    privacy: "Datenschutz",
    langSwitch: "English",
    lightboxHint: "Bild anklicken zum Vergrößern",
    categoryWord: "Kategorie",
    worksLabel: "Arbeiten in dieser Kategorie",
    footerRole: "Illustration & Graphic Design, Frankfurt am Main"
  },
  en: {
    backHome: "Home",
    contact: "Contact",
    otherCats: "More work",
    imprint: "Imprint",
    privacy: "Privacy",
    langSwitch: "Deutsch",
    lightboxHint: "Click an image to view it",
    categoryWord: "Category",
    worksLabel: "works in this category",
    footerRole: "Illustration & Graphic Design, Frankfurt am Main"
  }
};
