const express = require('express');
const app = express();
const admin = require('firebase-admin');
const cors = require('cors');
const port = 3000;

var serviceAccount = require('./beyond-vue-firebase-admin.json');

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

// Rota para obter todos os eventos
// Não requer parâmetros
// Resposta: Array de objetos JSON representando eventos. Status 200 se bem-sucedido, 500 em caso de erro.

app.get('/content', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("eventos").get();
    const eventos = snapshot.docs.map(doc => {
      const data = doc.data();
      // Formatando a data para o formato "yyyy-MM-dd'T'HH:mm:ss"
      const formattedStart = format(data.start.toDate(), "yyyy-MM-dd'T'HH:mm:ss");
      return {
        ...data,
        start: formattedStart,
        id: doc.id
      };
    });
    res.json(eventos);
  } catch (error) {
    console.error('Erro ao obter eventos:', error);
    res.status(500).send('Erro ao obter eventos');
  }
});

// Rota para adicionar um novo evento
// Parâmetros esperados: JSON com dados do novo evento
// Resposta: JSON com os dados do evento recém-adicionado e ID gerado. Status 201 se bem-sucedido, 500 em caso de erro.

app.post('/contents', async (req, res) => {
  console.log('POST /content chamado');
  const novoEvento = req.body;
  try {
    const eventoRef = await admin.firestore().collection("eventos").add(novoEvento);
    const eventoAdicionado = { ...novoEvento, id: eventoRef.id };
    console.log('Evento adicionado:', eventoAdicionado);
    res.status(201).json(eventoAdicionado);
  } catch (error) {
    console.error('Erro ao adicionar evento:', error);
    res.status(500).send('Erro ao adicionar evento');
  }
});

// Rota para atualizar um evento existente
// Parâmetros esperados: ID do evento na URL, JSON com os dados atualizados
// Resposta: String indicando sucesso. Status 200 se bem-sucedido, 400 se o ID não for fornecido, 404 se o evento não for encontrado, 500 em caso de erro.

app.put('/content/:id', async (req, res) => {
  const { id } = req.params;
  const dadosAtualizados = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID do evento é necessário." });
  }
  try {
    const eventoRef = admin.firestore().collection("eventos").doc(id);
    const doc = await eventoRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }

    delete dadosAtualizados.id;

    await eventoRef.update(dadosAtualizados);
    res.send('Evento atualizado com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).send('Erro ao atualizar evento');
  }
});

// Rota para excluir um evento existente
// Parâmetros esperados: ID do evento na URL
// Resposta: String indicando sucesso. Status 200 se bem-sucedido, 404 se o evento não for encontrado, 500 em caso de erro.

app.delete('/content/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const eventoRef = admin.firestore().collection("eventos").doc(id);
    const doc = await eventoRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }

    await eventoRef.delete();
    res.send('Evento excluído com sucesso.');
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    res.status(500).send('Erro ao excluir evento');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
