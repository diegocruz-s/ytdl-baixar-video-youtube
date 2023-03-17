import chalk from 'chalk'
import { randomUUID } from 'crypto'
import fs from 'fs'
import inquirer from 'inquirer'
import fetch from 'node-fetch'
import ytdl from 'ytdl-core'

function init () {
    inquirer.prompt([
        {
            name: 'videoUrl',
            message: chalk.blue('Digite a url do vídeo:'),
            prefix: '>>'
        },
    ]).then(async (answers) => {
        const regUrl = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/

        const url = answers.videoUrl
        if (!regUrl.test(url)) throw new Error('Url inválida!')

        const name = await getNameByUrlMusic(url)

        const folder = await chooseDestinationFolderForTheFiles()
        
        uploadMusic(url, name, folder)
    }).catch(error => {
        console.log(chalk.red('\n', error.message, '\n'))
        init()
    })
}

async function chooseDestinationFolderForTheFiles () {
    let nameFolder = ''
    const optionsFile = ['Arquivo existente', 'Criar arquivo']

    await inquirer.prompt([
        {
            type: 'list',
            name: 'optionsFileDestination',
            message: chalk.blue('Onde enviar os arquivos?'),
            prefix: '>>',
            choices: optionsFile
        }
    ])
    .then(async res => {
        const existingFiles = []

        if (res.optionsFileDestination === optionsFile[0]) {
            const dirPath = '../Baixar-videos-YT'
            fs.readdirSync(dirPath).forEach(file => {
                if (fs.statSync(file).isDirectory() && file !== 'node_modules' && file !== '.git') {
                    existingFiles.push(file)
                }
            })
        }

        nameFolder = await definitionFile(existingFiles)
    })

    return nameFolder

}

async function definitionFile (listFileNames) {
    let nameFolder = ''
    if(listFileNames.length > 0) {
        await inquirer.prompt([
            {
                type: 'list',
                choices: listFileNames,
                message: chalk.blue('Escolha o arquivo de destino'),
                prefix: '>>',
                name: 'nameFile',
            }
        ])
        .then(res => {
            nameFolder = `./${res.nameFile}`
        })
    } else {

        let checkExistingFile = true
        while(checkExistingFile) {
            await inquirer.prompt([
                {
                    name: 'nameFile',
                    message: chalk.blue('Nome do arquivo'),
                    prefix: '>>'
                }
            ])
            .then(async (dataName) => {
                if (fs.existsSync(`./${dataName.nameFile}`)) {
                    console.log('Arquivo existente')
                    await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'redirectFile',
                            message: chalk.gray('Redirecionar para o arquivo?'),
                            choices: ['Sim', 'Não']
                        }
                    ])
                    .then(res => {
                        if(res.redirectFile.toLowerCase() === 'sim') {
                            nameFolder = `./${dataName.nameFile}`
                            checkExistingFile = false
                        } else {
                            checkExistingFile = true
                        }
                    })
                } else {
                    fs.mkdirSync(`./${dataName.nameFile}`)
                    nameFolder = `./${dataName.nameFile}`
                    checkExistingFile = false 
                }
            })
        }        
    }

    return nameFolder

}

async function getNameByUrlMusic (url) {

    const response = await fetch(url)
    const html = await response.text()
    const title = html.match(/<title>(.*?)<\/title>/)[1]

    let formatTitle = 
        title
            .replace(' - YouTube', '')
            .toLowerCase()
            .replaceAll(' ', '-')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replaceAll(/[^a-zA-Z0-9\-]+/g,'', '')
            .replaceAll('--', '-')
            .replaceAll('---', '-')

    formatTitle += `-${randomUUID().slice(0, 8)}`

    return formatTitle
}

function uploadMusic (url, name, folder) {
    const writeStream = fs.createWriteStream(`${folder}/${name}.mp3`)
    const music = ytdl(url, { filter: 'audioonly' })

    console.log(chalk.yellow('\nAguarde...\n'))

    music
        .pipe(writeStream)

    writeStream.on('finish', () => {
        console.log(chalk.green('Música baixada\n'))
        process.exit()
    })
}

init()
