const SOURCES = [
  {
    name: "alerts.in.ua",
    url: "https://alerts.in.ua",
    description: "Активні тривоги по областях, районах і громадах. Оновлення кожні 30 с."
  },
  {
    name: "Укриття м. Львів",
    url: "https://opendata.city-adm.lviv.ua/dataset/ukryttia_lviv_ns",
    description: "Укриття Львівської МТГ з адресами, місткістю та координатами."
  },
  {
    name: "Укриття м. Івано-Франківськ",
    url: "https://data.gov.ua/dataset/100aa73c-53f5-47da-a0ec-217afa27ebc6",
    description: "Сховища з адресами та координатами."
  },
];

export default function SourcesPage() {
  return (
    <>
      <h1>Джерела даних</h1>
      <ul className="list">
        {SOURCES.map((s) => (
          <li key={s.name}>
            <strong>{s.url ? <a href={s.url} target="_blank">{s.name}</a> : s.name}</strong>
            <div className="muted">{s.description}</div>
          </li>
        ))}
      </ul>
    </>
  );
}
