import inquirer from 'inquirer'
import fs from 'fs'
import ytdl from 'ytdl-core'
import chalk from 'chalk'

function init() {
    inquirer.prompt([
        {
            name: 'videoUrl',
            message: chalk.blue('Digite a url do vídeo:'),
            prefix: '>>'
        },
        {
            name: 'nameMusic',
            message: chalk.blue('Nome da música:'),
            prefix: '>>'
        },
        {
            type: 'list',
            name: 'folderMusic',
            message: chalk.blue('Local da música:'),
            choices: ['Arquivo existente', 'Novo arquivo'],
            prefix: '>>'
        }
    ]).then(async (answers) => {
        const regUrl = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/

        const url = answers.videoUrl
        if (!regUrl.test(url)) throw new Error('Url inválida!')

        const name = answers.nameMusic.toLowerCase().replaceAll(' ', '-')
        if (!name) throw new Error('Nome é obrigatório!')

        const folder = await folderMusics(answers.folderMusic)
        
        uploadMusic(url, name, folder)
    }).catch(error => {
        console.log(chalk.red('\n', error.message, '\n'))
        init()
    })
}

async function folderMusics (option) {
    let folderName = ''

    try {
        if (option.toLowerCase().includes('existente')) {
            const dirPath = '../Baixar-videos-YT'
            const folders = []
    
            fs.readdirSync(dirPath).forEach(file => {
                if (fs.statSync(file).isDirectory() && file !== 'node_modules') {
                    folders.push(file)
                }
            })
    
            await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'selectFolder',
                        choices: folders,
                        message: 'Para onde a música vai? '
                    }
                ])
                .then(data => {
                    folderName = `./${data.selectFolder}`
                })
        } else {
            await inquirer
                .prompt([
                    {
                        name: 'newFolderName',
                        message: chalk.blue('Qual é o nome da nova pasta? '),
                        prefix: '>>'
                    }
                ])
                .then(async (data) => {
                    folderName = `./${data.newFolderName}`
                    if (fs.existsSync(folderName)) {
                        console.log('\n Diretório já existente, deseja direcionar para ele? \n')
                        await inquirer
                            .prompt([
                                {
                                    type: 'list',
                                    name: 'redirectFolder',
                                    message: chalk.cyan('Diretório já existente, deseja direcionar para ele?'),
                                    choices: ['Sim', 'Não']
                                }
                            ]).then(result => {
                                if(result.redirectFolder === 'Não') {
                                    return folderMusics(option)
                                }
                            })
                    }else {
                        fs.mkdirSync(folderName)
                    }
                })
        }
    } catch (error) {
        console.log(chalk.red('\n', error.message, '\n'))
        process.exit()
    }

    return folderName

}

function uploadMusic (url, name, folder) {
    const writeStream = fs.createWriteStream(`${folder}/${name}.mp3`)
    const music = ytdl(url, { filter: 'audioonly' })

    console.log(chalk.yellow('\nAguarde...\n'))

    music
        .pipe(writeStream)

    writeStream.on('finish', () => {
        console.log(chalk.green('\nMúsica baixada\n'))
        process.exit()
    })
}

init()
