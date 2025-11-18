import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.API_KEY,
});

let chat;

const funcoes = {
    taxaJurosParcelamento: ({ value }) => {
        const meses = typeof value === "string" ? parseInt(value) : value;
        if(meses <= 6)
            return 3;
        else if(meses <= 12)
            return 5;
        else if(meses <= 24)
            return 7;
    }
}

/* 
   Function Callings são funções específicas que fazemos para calcular algo e retornar para o usuário, algo que a IA sozinha não vai 
   conseguir fazer porque é relacionada ao projeto. Por exemplo essa função que calcula os juros baseado na quantidade de meses, é algo
   específico da empresa, então fazemos essa função para realizar o cálculo para o usuário e depois informamos a IA sobre essa função
   para ela entender em que contexto essa função deve ser executada. Obtendo o resultado, mandamos de volta para o modelo, assim ele
   vai gerar uma mensagem estruturada e "bonitinha" para o usuário visualizar. 
*/

// Exemplo de mensagem para usar no chat para ele executar essa função: quero saber a taxa de juros para parcelar minha viagem em 10 vezes
const taxaJurosParcelamento = {
    name: "taxaJurosParcelamento",
    description: "Retorna a taxa de juros para parcelamento baseado na quantidade de meses",
    parameters: {
        type: Type.OBJECT,
        properties: {
            value: { type: Type.NUMBER }
        },
        required: ["value"]
    }
}

const config = {
  tools: [{
    functionDeclarations: [taxaJurosParcelamento]
  }]
};

function inicializaChat(){
    chat = ai.chats.create(
        {
            model: "gemini-2.5-flash",
            config: config,
            history: [
                {
                    role: "user",
                    parts: [{ text: `Você é Jordi, um chatbot amigável que representa a empresa Jornada Viagens, que vende pacotes turísticos 
                    para destinos nacionais e internacionais. Você pode responder mensagens que tenham relação com viagens.` }],
                },
                {
                    role: "model",
                    parts: [{ text: `Olá! Obrigado por entrar em contato com o Jornada Viagens. Antes de começar a responder sobre suas dúvidas, 
                        preciso do seu nome e endereço de e-mail.` }]
                },
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            }
        },
        { apiVersion: "v1beta" }
    );
}

export { chat, funcoes, inicializaChat }