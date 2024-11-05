/**
 * Parse SQL CREATE TABLE. Simple initial version for community to improve.
 */
Draw.loadPlugin(function(ui) {

    function TableModel() {
        this.Name = null;
        this.Properties = []
    }
    function PropertyModel() {
        this.Name = null;
        this.Type = null;
        this.TableName = null;
        this.ForeignKey = [];
        this.IsPrimaryKey = false;
        this.IsForeignKey = false;
    }
    var package = '';
    var packageCell = null;
    //SQL Modes
    var tableList = [];
    var cells = [];
    // var tableCell = null;
    // var rowCell = null;
    var maxRowCellwidth = 0;
    var dx = 0;
    var dy = 26;
    var maxTableHeight = 0;
    var exportedTables = 0;

    var rowCells = {};
    var tableCells = {};
    var composites = {};


    //Create Base div
    var div = document.createElement('div');
    div.style.userSelect = 'none';
    div.style.overflow = 'hidden';
    div.style.padding = '10px';
    div.style.height = '100%';

    var graph = ui.editor.graph;

    var MODXInput = document.createElement('textarea');
    MODXInput.style.height = '200px';
    MODXInput.style.width = '100%';
    let testModx = `<?xml version="1.0" encoding="UTF-8"?>
<model package="tsklad" baseClass="xPDOObject" platform="mysql" defaultEngine="MyISAM" phpdoc-package="tsklad" version="1.1">

	<object class="tSkladOrders" table="tsklad_orders" extends="xPDOSimpleObject" xpos="379.99998474121094" ypos="24">
		<field key="period_id" dbtype="int" precision="10" phptype="integer" null="false" title="Период"/>
		<field key="order_id" dbtype="int" precision="10" phptype="integer" null="true"/>
		<field key="excel_id" dbtype="int" precision="10" phptype="integer" null="true"/>
		<field key="org_id" dbtype="int" precision="10" phptype="integer" null="true"/>
		
		
		<composite alias="tSkladOrderList" class="tSkladOrderList" local="id" foreign="sk_order_id" cardinality="many" owner="local"/>
	</object>
	
	<object class="tSkladOrdersStatus" table="tsklad_status" extends="xPDOSimpleObject" xpos="379.99998474121094" ypos="24">
		<field key="label" dbtype="varchar" precision="100" phptype="string" null="false" default=""/>
	</object>
	
	<object class="tSkladOrderList" table="tsklad_order_list" extends="xPDOSimpleObject" xpos="835.9999847412109" ypos="24">
		<field key="sk_order_id" dbtype="int" precision="10" phptype="integer" null="true"/>
		<field key="excel_id" dbtype="int" precision="10" phptype="integer" null="true"/>
		<field key="nom_id" dbtype="int" precision="10" phptype="integer" null="true"/>
		<field key="detail_nom_id" dbtype="int" precision="10" phptype="integer" null="true"/>
		<field key="systema" dbtype="varchar" precision="100" phptype="string" null="false" default=""/>
		<field key="sys_number" dbtype="varchar" precision="100" phptype="string" null="false" default=""/>
		<field key="sech" dbtype="varchar" precision="100" phptype="string" null="false" default=""/>
		<field key="name" dbtype="varchar" precision="100" phptype="string" null="true" default=""/>
		
		<index alias="sk_order_id" name="sk_order_id" primary="false" unique="false" type="BTREE">
			<column key="sk_order_id" length="" collation="A" null="false"/>
		</index>

		
		<aggregate alias="tSkladOrders" class="tSkladOrders" local="sk_order_id" foreign="id" cardinality="one" owner="foreign"/>
	</object>
	
</model>`;
    MODXInput.value = testModx;
    mxUtils.br(div);
    div.appendChild(MODXInput);

    var graph = ui.editor.graph;

    // Extends Extras menu
    mxResources.parse('fromMODX=From MODX');

    var wnd = new mxWindow(mxResources.get('fromMODX'), div, document.body.offsetWidth - 480, 140,
        320, 300, true, true);
    wnd.destroyOnClose = false;
    wnd.setMaximizable(false);
    wnd.setResizable(false);
    wnd.setClosable(true);

    


    function CreateTable(name) {
        var table = new TableModel;

        table.Name = name;

        //Count exported tables
        exportedTables++;

        return table;
    };

    function parseSchema(text) {
        if (window.DOMParser)
        {
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(text, "text/xml");
            package = xmlDoc.getElementsByTagName("model")[0].attributes['package'].nodeValue
            
            let objects = xmlDoc.getElementsByTagName("model")[0].getElementsByTagName("object");
            for(let k = 0;k<objects.length;k++){
                let tableName = objects[k].attributes['class'].nodeValue
                let table = CreateTable(tableName)
                if(objects[k].attributes['extends'].nodeValue == "xPDOSimpleObject"){
                    let name = 'id'
                    let type = 'int'
                    let property = new PropertyModel
                    property.Name = name
                    property.Type = type
                    table.Properties.push(property)
                }
                let fields = objects[k].getElementsByTagName("field")
                for(let i = 0;i<fields.length;i++){
                    let field = fields[i]
                    let name = field.attributes['key'].nodeValue
                    let type = field.attributes['dbtype'].nodeValue
                    let property = new PropertyModel
                    property.Name = name
                    property.Type = type
                    table.Properties.push(property)
                }
                let composites0 = objects[k].getElementsByTagName("composite")
                for(let i = 0;i<composites0.length;i++){
                    composites[tableName] = {
                        class : composites0[i].attributes['class'].nodeValue,
                        local: composites0[i].attributes['local'].nodeValue,
                        foreign: composites0[i].attributes['foreign'].nodeValue
                    }
                }
                tableList.push(table)
            }
        }else{
            alert("not window.DOMParser");
        }
        // alert(JSON.stringify(xmlDoc, null, 4))
        //Create Table in UI
        CreateTableUI();
    };
   
    function AddRow(propertyModel, tableCell,h,tableName) {

        var cellName = propertyModel.Name;

        cellName += ' | ' + propertyModel.Type;
        var cellNameLength = 64 + cellName.length*4;

        let rowCell = new mxCell(cellName, new mxGeometry(0, h, cellNameLength, 26),
            'shape=partialRectangle;top=0;left=0;right=0;bottom=0;align=left;verticalAlign=top;spacingTop=-2;fillColor=none;spacingLeft=26;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;dropTarget=0;');
        rowCell.vertex = true;

        // var columnType = propertyModel.IsPrimaryKey && propertyModel.IsForeignKey ? 'PK | FK' : propertyModel.IsPrimaryKey ? 'PK' : propertyModel.IsForeignKey ? 'FK' : '';

        // var left = sb.cloneCell(rowCell, columnType);
        // left.connectable = false;
        // left.style = 'shape=partialRectangle;top=0;left=0;bottom=0;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=180;points=[];portConstraint=eastwest;part=1;'
        // left.geometry.width = 54;
        // left.geometry.height = 26;
        // rowCell.insert(left);

        // let sizerowCell = ui.editor.graph.getPreferredSizeForCell(rowCell);

        // if (sizerowCell !== null && tableCell.geometry.width < sizerowCell.width + 10) {
        //     tableCell.geometry.width = sizerowCell.width + 10;
        // }
        // if(sizerowCell.width > maxRowCellwidth) maxRowCellwidth = sizerowCell.width

        if(!rowCells[tableName]) rowCells[tableName] = {}
        rowCells[tableName][propertyModel.Name] = rowCell
        
        tableCell.insert(rowCell);
        tableCell.geometry.height += 26;

        // rowCell = null;

    };
    // var dy = 0;
    // var maxTableHeight = 0;
    function CreateTableUI() {
        packageCell = new mxCell(package, new mxGeometry(0, 0, 500, 500),
            'swimlane;whiteSpace=wrap;html=1;');
        packageCell.vertex = true;

        tableList.forEach(function(tableModel) {
            
            if(dx > 1300){
                dx = 0
                dy += 200 //maxTableHeight + 40
                maxTableHeight = 0
                packageCell.geometry.width = 1400;
            }
            //Define table size width
            var maxNameLenght = 100 + tableModel.Name.length*4;

            //Create Table
            tableCells[tableModel.Name] = new mxCell(tableModel.Name, new mxGeometry(dx, dy, maxNameLenght, 26),
                'swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=26;fillColor=default;horizontalStack=0;resizeParent=1;resizeLast=0;collapsible=1;marginBottom=0;swimlaneFillColor=default;align=center;');
            tableCells[tableModel.Name].vertex = true;

            //Resize row
            // var size = ui.editor.graph.getPreferredSizeForCell();
            

            

            let h = 26
            //Add properties
            tableModel.Properties.forEach(function(propertyModel) {
                //Add row
                AddRow(propertyModel, tableCells[tableModel.Name], h,tableModel.Name);
                h += 26;
            });
            // tableCells[tableModel.Name].geometry.width = 300
            // alert(tableModel.Name+" "+maxRowCellwidth)
            // if (maxRowCellwidth > 0 && maxNameLenght < maxRowCellwidth) {
            //     tableCells[tableModel.Name].geometry.width = maxRowCellwidth
            // }

            if(tableCells[tableModel.Name].geometry.height > maxTableHeight){
                maxTableHeight = tableCells[tableModel.Name].geometry.height
            }
            tableCells[tableModel.Name].setCollapsed(true);
            tableCells[tableModel.Name].geometry.height = 26;
            //Add Table to cells
            packageCell.insert(tableCells[tableModel.Name]);
            //Close table
            dx += tableCells[tableModel.Name].geometry.width + 40;
            // tableCell = null;
        });
        
        packageCell.geometry.height = dy + maxTableHeight;
        var graph = ui.editor.graph;
        for(let table in composites){
            if(!rowCells[table]){
                alert(table+" not found")
            }
            if(!rowCells[table][composites[table].local]){
                alert(table+" "+composites[table].local+" not found")
            }
            if(!rowCells[composites[table].class]){
                alert(composites[table].class+" not found")
            }
            if(!rowCells[composites[table].class][composites[table].foreign]){
                alert(table+" "+composites[table].class+" "+composites[table].foreign+" not found")
            }
            graph.insertEdge(packageCell, null, '',rowCells[table][composites[table].local],rowCells[composites[table].class][composites[table].foreign], "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;");
        }
        //Add packageCell to cells
        cells.push(packageCell);
        
        if (cells.length > 0) {
            
            var view = graph.view;
            var bds = graph.getGraphBounds();
            // graph.getModel().beginUpdate();
            // graph.insertEdge(packageCell, null, '',tableCells['tSkladOrders'],tableCells['tSkladOrdersStatus'], "entryX=0.25;entryY=0");
            // Computes unscaled, untranslated graph bounds
            var x = 0 //Math.ceil(Math.max(0, bds.x / view.scale - view.translate.x) + 4 * graph.gridSize);
            var y = Math.ceil(Math.max(0, (bds.y + bds.height) / view.scale - view.translate.y) + 4 * graph.gridSize);

            graph.setSelectionCells(graph.importCells(cells, x, y));
            // graph.getModel().endUpdate();
            graph.scrollCellToVisible(graph.getSelectionCell());
            
            tableCells = {};
            packageCell = null;
            cells = [];
            rowCells = {};
            composites = {};
            tableList = [];
            dx = 0;
            dy = 26;
            maxTableHeight = 0;
            // graph.connectCell(e2,tableCells['tSkladOrdersStatus'],false, mxShape.prototype.constraints[0]);
            // for( let k in tableCells){
            //     graph.fireEvent(new mxEventObject('cellsInserted', 'cells', tableCells[k]));
            // }
        }

        // wnd.setVisible(false);
    };

    function parseMenu(text){
        let menuCell = new mxCell('Menu', new mxGeometry(0, 0, 500, 500),
            'swimlane;whiteSpace=wrap;html=1;');
        menuCell.vertex = true;
        var lines = text.split("\n");
        let parentItem = null
        dx = 0
        dy = 26
        let h = 26
        let maxNameLenght = 0
        for(let i = 0;i<lines.length;i++){
            let line = lines[i]
            let item = line.trim()
            if(item === "") continue
            if (item[0] === "-") {
                let name = item.substring(1).trim()
                maxNameLenght = 64 + name.length*4
                let childItem = new mxCell(name, new mxGeometry(0, h, maxNameLenght, 26),
                'shape=partialRectangle;top=0;left=0;right=0;bottom=0;align=left;verticalAlign=top;spacingTop=-2;fillColor=none;spacingLeft=26;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;dropTarget=0;');
                childItem.vertex = true;
                if(parentItem){
                    parentItem.insert(childItem);
                    parentItem.geometry.height += 26;
                }
                h += 26

            }else{
                if(parentItem){
                    menuCell.insert(parentItem);
                    dx += parentItem.geometry.width + 40;
                }
                h = 26
                maxNameLenght = 64 + item.length*4
                parentItem = new mxCell(item, new mxGeometry(dx, 26, maxNameLenght, 26),
                'swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=26;fillColor=default;horizontalStack=0;resizeParent=1;resizeLast=0;collapsible=1;marginBottom=0;swimlaneFillColor=default;align=center;');
                parentItem.vertex = true;
            }
            
        }
        if(parentItem){
            menuCell.insert(parentItem);
            dx += parentItem.geometry.width;
            menuCell.geometry.width = dx
        }
        cells.push(menuCell);
        if (cells.length > 0) {
            var graph = ui.editor.graph;
            var view = graph.view;
            var bds = graph.getGraphBounds();
            // Computes unscaled, untranslated graph bounds
            var x = 0 //Math.ceil(Math.max(0, bds.x / view.scale - view.translate.x) + 4 * graph.gridSize);
            var y = Math.ceil(Math.max(0, (bds.y + bds.height) / view.scale - view.translate.y) + 4 * graph.gridSize);

            graph.setSelectionCells(graph.importCells(cells, x, y));
            graph.scrollCellToVisible(graph.getSelectionCell());
            
            tableCells = {};
            packageCell = null;
            cells = [];
            rowCells = {};
            composites = {};
            tableList = [];
            dx = 0;
            dy = 26;
            maxTableHeight = 0;
        }

    }
    mxUtils.br(div);
    var selected = 'MODX';
    var Select = document.createElement('select');

    var option1 = document.createElement('option')
    option1.value = 'MODX';
    option1.text = 'MODX';
    option1.selected = true;
    Select.onchange = function(){
        if(Select.value == 'menu'){
            MODXInput.value = `Логистика
-Расчеты
-Заказы
Производство
-Смены
-Наряды
-Отгрузки`;
        selected = 'menu';
        }else{
            MODXInput.value = testModx
            selected = 'MODX';
        }
    }
    Select.appendChild(option1);

    var option2 = document.createElement('option')
    option2.value = 'menu';
    option2.text = 'menu';
    Select.appendChild(option2);

    div.appendChild(Select);

    var resetBtn = mxUtils.button(mxResources.get('reset'), function()
    {
        MODXInput.value = '';
    });

    resetBtn.style.marginTop = '8px';
    resetBtn.style.marginRight = '4px';
    resetBtn.style.padding = '4px';
    div.appendChild(resetBtn);

    var btn = mxUtils.button('Втавить', function()
    {
        try
        {
            if(selected == 'MODX'){
                parseSchema(MODXInput.value);
            }else{
                parseMenu(MODXInput.value);
            }
            
        }
        catch (e)
        {
            ui.handleError(e);
        }
    });

    btn.style.marginTop = '8px';
    btn.style.padding = '4px';
    div.appendChild(btn);

    // Adds action
    ui.actions.addAction('fromMODX', function() {
        wnd.setVisible(!wnd.isVisible());

        if (wnd.isVisible()) {
            MODXInput.focus();
        }
    });

    var theMenu = ui.menus.get('insert');
    var oldMenu = theMenu.funct;

    theMenu.funct = function(menu, parent) {
        oldMenu.apply(this, arguments);

        ui.menus.addMenuItems(menu, ['fromMODX'], parent);
    };

    wnd.setVisible(false);
});