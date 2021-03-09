let logo
$(document).ready(function(){
    logo = new Logo(document.getElementById('logo'), -300, 300, -200, 200)
    $('#commit').click(function(){
        let text = $('#ins')
        logo.interpret(text.val())
        addHistory(text.val())
        text.val('')
    })

    $('.sizeChanger').change(function (){
        logo.changeSizes($('#minX').val(), $('#maxX').val(), $('#minY').val(), $('#maxY').val())
    })
})

function runHistory(pointer){
    let ins = pointer.parent().parent().children()[1].innerHTML
    logo.interpret(ins)
    addHistory(ins)
}

function addHistory(content){
    let his = $('#insHistory')
    let id = Number(his.children().first().children().first().html()) + 1
    his.prepend('<tr>' +
        '<td>'+id+'</td>'+
        '<td>'+content+'</td>'+
        '<td><input type="button" class="btn btn-primary" onClick="runHistory($(this))" value="Rerun"></td>' +
        '</tr>'
    )
}