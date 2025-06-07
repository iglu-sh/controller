export {}

const res = await fetch('http://localhost:3001/api/v1/builder/116/listen',{
    method: 'GET',
})
const reader = res.body.getReader()
while(true){
    const chunk = await reader.read()
    console.log(new TextDecoder().decode(chunk.value))
    if (chunk.done) {
        break
    }
}