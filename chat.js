import { incorporarDocumentos, incorporarPergunta, leArquivos } from './embedding.js';

const arquivos = await leArquivos(["Pacotes_Argentina.txt", "Pacotes_EUA.txt", "Politicas.txt"]);

const documentos = await incorporarDocumentos(
    arquivos,
);

// console.log(documentos);

export async function executaChat(chat, funcoes, mensagem) {
    // console.log("Tamanho do histórico: " + (await chat.getHistory()).length);
    let doc = await incorporarPergunta(mensagem, documentos);
    let prompt = mensagem + " talvez esse trecho te ajude a formular a resposta " + doc.text;
    const response = await chat.sendMessage({
        message: prompt,
    });

    const content = response.candidates[0].content;
 
    const fc = content.parts[0].functionCall;
    const text = content.parts.map(({ text }) => text).join("");
    // console.log("text: ", text);
    // console.log("fc: ", fc);
    
    if (fc) {
        const { name, args } = fc;
        const fn = funcoes[name];
        if (!fn) {
            throw new Error(`Unknown function "${name}"`);
        }
        const fr = {
            functionResponse: {
                name,
                response: {
                    name,
                    content: funcoes[name](args),
                }
            },
        }

        console.log("fr: ", fr);

        // Devolvendo o resultado do cálculo da função para o gemini gerar uma estrutura de resposta para o usuário,
        // em vez de só retornar um número, retornar um textinho bem formulado pela ia com o resultado da function calling
        const request2 = [fr];
        const response2 = await chat.sendMessage({
            message: request2,
        });
        const result2 = response2.candidates[0].content.parts[0].text;
        return result2;
    } else if (text) {
        return text;
    }
}