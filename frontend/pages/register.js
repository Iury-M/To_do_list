import { useState } from "react";
import api from "../utils/api";
import { useRouter } from "next/router";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/register", {
        name, // <-- Adicionado aqui
        email,
        password,
        role: isAdmin ? "ADMIN" : "USER",
      });
      alert("Cadastro realizado com sucesso");
      router.push("/login");
    } catch (err) {
      alert("Erro ao cadastrar");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded shadow w-80">
        <h1 className="text-xl font-bold mb-4">Cadastro</h1>

        <input
          type="text"
          name="name"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-2 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          className="w-full mb-2 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            className="mr-2"
            checked={isAdmin}
            onChange={() => setIsAdmin(!isAdmin)}
          />
          Cadastrar como admin
        </label>

        <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Cadastrar
        </button>
      </form>
    </main>
  );
}
