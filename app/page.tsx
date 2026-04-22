import axios from "axios";

type TableOneRow = {
  id: number;
  created_at: string;
  name: string;
};

async function getNames(): Promise<TableOneRow[]> {
  const res = await axios.get("http://localhost:3000/api/table-one");
  return res.data;
}

export default async function Home() {
  const rows = await getNames();

  return (
    <main>
      {rows.map((row) => (
        <p key={row.id}>{row.name}</p>
      ))}
    </main>
  );
}
