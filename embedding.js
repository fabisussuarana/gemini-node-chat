// import { GoogleGenerativeAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs} from "fs";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

async function embedRetrievalQuery(queryText) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text: queryText }] },
  });
  const embedding = result.embedding;
  return embedding.values;
}

/* 
   É interessante(e a documentação também recomenda) guardar os embeddings(vetores númericos gerados a partir dos textos dos arquivos) 
   dentro de um banco de dados, isso porque cada vez que esses textos são convertidos, é feita uma requisição para a IA. Guardando no
   banco é possível fazer a comparação de qual vetor é melhor para responder o usuário sem precisar fazer toda vez uma requisição para
   a IA, dessa forma evita custos e poupa tempo(a não ser que haja uma mudança significativa nos arquivos, daí é interessante fazer uma 
   nova requisição para atualizar). 
*/

export async function incorporarDocumentos(docTexts) {
  const result = await embeddingModel.batchEmbedContents({
    requests: docTexts.map((t) => ({
      content: { parts: [{ text: t }] },
    })),
  });
  const embeddings = result.embeddings;
  return embeddings.map((e, i) => ({ text: docTexts[i], values: e.values }));
}

export async function leArquivos(arquivos) {
    try {
        const documentos = [];
        for (const filePath of arquivos) {
            const documento = await fs.readFile(filePath, 'utf-8');
            documentos.push(documento);
        }
        return documentos;
    } catch (error) {
        console.error('Erro ao ler os documentos', error);
        return [];
    }
}

function euclideanDistance(a, b) {
  let sum = 0;
  for (let n = 0; n < a.length; n++) {
    sum += Math.pow(a[n] - b[n], 2);
  }
  return Math.sqrt(sum);
}

/* 
    Aqui é feita a conversão da pergunta do usuário em um vetor de números e então usa a distância euclidiana para
    comparar os embeddings(o vetor da pergunta com os vetores dos arquivos), dessa forma o que mais se aproximar do 
    vetor da pergunta, é escolhido para ser usado na resposta para o usuário. 
*/
export async function incorporarPergunta(queryText, docs) {
  const queryValues = await embedRetrievalQuery(queryText);
//   console.log(queryText);

  let bestDoc = {}
  let minDistance = 1.0
  
  for (const doc of docs) {
    let distance = euclideanDistance(doc.values, queryValues);
    // console.log(distance);
    if (distance < minDistance) {
        minDistance = distance
        bestDoc = doc
    }
    console.log(
      "  ",
      distance,
      doc.text.substr(0, 40),
    );
  }
  return bestDoc;
}