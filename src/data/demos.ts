import { parseCsv } from "@/lib/data/parsers";
import type { ColumnMapping, RawDataRow } from "@/types/data";

export interface DemoDataset {
  id: string;
  name: string;
  description: string;
  rows: RawDataRow[];
  mapping: ColumnMapping;
  title: string;
  subtitle: string;
  valueFormat: "compact" | "integer" | "percentage" | "currency";
  valuePrefix?: string;
  valueSuffix?: string;
  themeId: string;
}

function rows(csv: string): RawDataRow[] {
  return parseCsv(csv.trim()).rows;
}

const technologyMarks: Record<string, string> = {
  Apple: "/entity-marks/apple.svg",
  Google: "/entity-marks/google.svg",
  Amazon: "/entity-marks/amazon.svg",
  Microsoft: "/entity-marks/microsoft.svg",
  Samsung: "/entity-marks/samsung.svg",
  Facebook: "/entity-marks/meta.svg",
  Meta: "/entity-marks/meta.svg",
  Intel: "/entity-marks/intel.svg",
  IBM: "/entity-marks/ibm.svg",
  Nvidia: "/entity-marks/nvidia.svg",
};

function rowsWithImages(csv: string, categoryColumn: string, marks: Record<string, string>): RawDataRow[] {
  return rows(csv).map((row) => ({ ...row, image: marks[String(row[categoryColumn] ?? "")] ?? null }));
}

export const demoDatasets: DemoDataset[] = [
  {
    id: "tech-leaders",
    name: "Global Tech Leaders",
    description: "Brand value · 8 years · 8 companies",
    title: "The Race to Define Technology",
    subtitle: "Global brand value, 2018–2025",
    valueFormat: "currency",
    themeId: "modern-dark",
    mapping: { time: "year", category: "company", value: "value", group: "sector", image: "image" },
    rows: rowsWithImages(`
year,company,value,sector
2018,Apple,214480,Consumer Tech
2018,Google,155506,Internet
2018,Amazon,100764,Commerce
2018,Microsoft,92715,Software
2018,Samsung,59890,Consumer Tech
2018,Facebook,45168,Internet
2018,Intel,43293,Semiconductors
2018,IBM,42972,Enterprise
2019,Apple,234241,Consumer Tech
2019,Google,167713,Internet
2019,Amazon,125263,Commerce
2019,Microsoft,108847,Software
2019,Samsung,61098,Consumer Tech
2019,Facebook,39857,Internet
2019,Intel,40197,Semiconductors
2019,IBM,40381,Enterprise
2020,Apple,322999,Consumer Tech
2020,Amazon,200667,Commerce
2020,Microsoft,166001,Software
2020,Google,165444,Internet
2020,Samsung,62300,Consumer Tech
2020,Facebook,35200,Internet
2020,Intel,36700,Semiconductors
2020,IBM,34900,Enterprise
2021,Apple,408251,Consumer Tech
2021,Amazon,249249,Commerce
2021,Microsoft,210191,Software
2021,Google,196811,Internet
2021,Samsung,74635,Consumer Tech
2021,Facebook,54500,Internet
2021,Intel,35400,Semiconductors
2021,Nvidia,34500,Semiconductors
2022,Apple,482215,Consumer Tech
2022,Microsoft,278288,Software
2022,Amazon,274819,Commerce
2022,Google,251751,Internet
2022,Samsung,87700,Consumer Tech
2022,Nvidia,52100,Semiconductors
2022,Facebook,34000,Internet
2022,Intel,32600,Semiconductors
2023,Apple,502680,Consumer Tech
2023,Microsoft,316659,Software
2023,Amazon,276929,Commerce
2023,Google,260260,Internet
2023,Samsung,91400,Consumer Tech
2023,Nvidia,84900,Semiconductors
2023,Meta,69000,Internet
2023,Intel,29500,Semiconductors
2024,Apple,516582,Consumer Tech
2024,Microsoft,340442,Software
2024,Google,333441,Internet
2024,Amazon,308926,Commerce
2024,Nvidia,201800,Semiconductors
2024,Samsung,99800,Consumer Tech
2024,Meta,91600,Internet
2024,Intel,24700,Semiconductors
2025,Apple,574510,Consumer Tech
2025,Microsoft,461070,Software
2025,Google,413000,Internet
2025,Amazon,356400,Commerce
2025,Nvidia,284200,Semiconductors
2025,Meta,120700,Internet
2025,Samsung,110600,Consumer Tech
2025,Intel,21800,Semiconductors`, "company", technologyMarks),
  },
  {
    id: "world-population",
    name: "World Population",
    description: "Population · 7 decades · 8 countries",
    title: "Where the World Lives",
    subtitle: "Population growth across seven decades",
    valueFormat: "compact",
    themeId: "documentary",
    mapping: { time: "year", category: "country", value: "population", group: "region" },
    rows: rows(`
year,country,population,region
1960,China,654000000,Asia
1960,India,445000000,Asia
1960,United States,181000000,Americas
1960,Indonesia,88300000,Asia
1960,Pakistan,46000000,Asia
1960,Brazil,73000000,Americas
1960,Nigeria,45000000,Africa
1960,Bangladesh,50000000,Asia
1970,China,818000000,Asia
1970,India,555000000,Asia
1970,United States,205000000,Americas
1970,Indonesia,115000000,Asia
1970,Pakistan,58000000,Asia
1970,Brazil,96000000,Americas
1970,Nigeria,56000000,Africa
1970,Bangladesh,67000000,Asia
1980,China,981000000,Asia
1980,India,698000000,Asia
1980,United States,227000000,Americas
1980,Indonesia,148000000,Asia
1980,Pakistan,81000000,Asia
1980,Brazil,122000000,Americas
1980,Nigeria,73000000,Africa
1980,Bangladesh,84000000,Asia
1990,China,1144000000,Asia
1990,India,870000000,Asia
1990,United States,250000000,Americas
1990,Indonesia,181000000,Asia
1990,Pakistan,115000000,Asia
1990,Brazil,151000000,Americas
1990,Nigeria,95000000,Africa
1990,Bangladesh,107000000,Asia
2000,China,1263000000,Asia
2000,India,1057000000,Asia
2000,United States,282000000,Americas
2000,Indonesia,216000000,Asia
2000,Pakistan,154000000,Asia
2000,Brazil,175000000,Americas
2000,Nigeria,123000000,Africa
2000,Bangladesh,131000000,Asia
2010,China,1341000000,Asia
2010,India,1241000000,Asia
2010,United States,311000000,Americas
2010,Indonesia,246000000,Asia
2010,Pakistan,194000000,Asia
2010,Brazil,196000000,Americas
2010,Nigeria,161000000,Africa
2010,Bangladesh,148000000,Asia
2020,China,1425000000,Asia
2020,India,1396000000,Asia
2020,United States,336000000,Americas
2020,Indonesia,274000000,Asia
2020,Pakistan,227000000,Asia
2020,Brazil,213000000,Americas
2020,Nigeria,208000000,Africa
2020,Bangladesh,167000000,Asia
2025,China,1416000000,Asia
2025,India,1464000000,Asia
2025,United States,347000000,Americas
2025,Indonesia,286000000,Asia
2025,Pakistan,255000000,Asia
2025,Nigeria,238000000,Africa
2025,Brazil,213000000,Americas
2025,Bangladesh,176000000,Asia`),
  },
  {
    id: "languages",
    name: "Programming Languages",
    description: "Developer share · 6 years · 8 languages",
    title: "Languages Developers Choose",
    subtitle: "Share of developers using each language",
    valueFormat: "percentage",
    themeId: "neon-signal",
    mapping: { time: "year", category: "language", value: "share" },
    rows: rows(`
year,language,share
2020,JavaScript,67.7
2020,HTML/CSS,63.1
2020,SQL,54.7
2020,Python,44.1
2020,Java,40.2
2020,Bash,33.1
2020,C#,31.4
2020,TypeScript,25.4
2021,JavaScript,64.9
2021,HTML/CSS,56.1
2021,Python,48.2
2021,SQL,47.1
2021,Java,35.4
2021,Bash,34.8
2021,TypeScript,30.2
2021,C#,27.9
2022,JavaScript,65.4
2022,HTML/CSS,55.1
2022,SQL,49.4
2022,Python,48.1
2022,TypeScript,34.8
2022,Java,33.3
2022,Bash,33.1
2022,C#,27.9
2023,JavaScript,63.6
2023,HTML/CSS,52.9
2023,Python,49.3
2023,SQL,48.7
2023,TypeScript,38.9
2023,Bash,32.4
2023,Java,30.6
2023,C#,27.6
2024,JavaScript,62.3
2024,HTML/CSS,52.9
2024,Python,51.0
2024,SQL,51.0
2024,TypeScript,38.5
2024,Bash,33.9
2024,Java,30.3
2024,C#,27.8
2025,JavaScript,61.2
2025,Python,57.9
2025,HTML/CSS,51.3
2025,SQL,49.8
2025,TypeScript,42.4
2025,Bash,34.2
2025,Java,29.6
2025,C#,27.1`),
  },
  {
    id: "football-clubs",
    name: "Football Clubs",
    description: "Club revenue · 6 seasons · 8 clubs",
    title: "Football's Money League",
    subtitle: "Annual revenue of Europe's leading clubs",
    valueFormat: "currency",
    themeId: "sports-broadcast",
    mapping: { time: "season", category: "club", value: "revenue" },
    rows: rows(`
season,club,revenue
2019,Barcelona,841
2019,Real Madrid,757
2019,Manchester United,711
2019,Bayern Munich,660
2019,PSG,636
2019,Manchester City,611
2019,Liverpool,605
2019,Tottenham,521
2020,Barcelona,715
2020,Real Madrid,691
2020,Bayern Munich,634
2020,Manchester United,580
2020,Liverpool,558
2020,Manchester City,550
2020,PSG,541
2020,Chelsea,469
2021,Manchester City,645
2021,Real Madrid,641
2021,Bayern Munich,611
2021,Barcelona,582
2021,Manchester United,558
2021,PSG,556
2021,Liverpool,550
2021,Chelsea,493
2022,Manchester City,731
2022,Real Madrid,714
2022,Liverpool,702
2022,Manchester United,689
2022,PSG,654
2022,Bayern Munich,654
2022,Barcelona,638
2022,Chelsea,568
2023,Real Madrid,831
2023,Manchester City,826
2023,PSG,802
2023,Barcelona,800
2023,Manchester United,746
2023,Bayern Munich,744
2023,Liverpool,683
2023,Chelsea,589
2024,Real Madrid,1046
2024,Manchester City,838
2024,PSG,806
2024,Manchester United,771
2024,Bayern Munich,765
2024,Barcelona,760
2024,Arsenal,717
2024,Liverpool,715`),
  },
];
