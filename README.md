Директор попросил схему базы для компонента в MODX. Раньше был сервис для рисования схемы, но он давно не работает. Подумав, сделал плагин для draw.io и выгрузил схему. Директор посмотрел и сказал что ничего не понятно :-). Ну он не спец. Мне плагин, наверно, больше не пригодиться, но вдруг кому-то пригодиться.
<img src="https://file.modx.pro/files/4/9/4/494707b63388e930e320ce0b7e1ac98d.png" />

Гитхаб <a href="https://github.com/tuniekov/modx_drawio">https://github.com/tuniekov/modx_drawio</a>. Плагин modx_base.js.

Для использования загрузить и установить draw.io desktop из <a href="https://github.com/jgraph/drawio-desktop/releases/tag/v24.7.17">https://github.com/jgraph/drawio-desktop/releases/tag/v24.7.17</a> .
Запустить draw.io.exe c ключом --enable-plugins
<code>"C:\Program Files\draw.io\draw.io.exe" --enable-plugins</code>
Добавить плагин modx_base.js из меню "Дополнительно->Плагины". Кнопка добавить и загрузить из файла.

После перезапуска draw.io плагин появится в меню "Положение->Вставить->From MODX"
В окне вставить xml схему MODX нужного компонента и нажать кнопку Вставить.