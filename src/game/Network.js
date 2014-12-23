/*global Phaser, R, console, game, Eureca, playerList, players, UI*/
"use strict";

var Network = {};

Network.ready = false;

Network.isMine = function (id) {
    return Network.myId === id;
};

Network.setup = function () {
    console.log('Network.setup');
    //create an instance of eureca.io client
    Network.client = new Eureca.Client();

    Network.client.ready(function (proxy) {
        Network.server = proxy;
    });




    //methods defined under "exports" namespace become available in the server side

    Network.client.exports.setId = function (id) {
        console.log('Network.setId for', playerName);
        Network.myId = id;
        //create() is moved here to make sure nothing is created before uniq id assignation
        Network.server.handshake(id, cursorId, playerName, roomName);
        console.log('connecting to table', roomName);

        create();
        Network.ready = true;
    };



    Network.client.exports.kill = function (client) {
        console.log('killing', client.name);
        if (playerList[client.id]) {
            playerList[client.id].kill();
            console.log('killing ', client.name, playerList[client.id]);
            delete playerList[client.id];

            UI.message(client.name, 'left the table...');
            UI.updateNames();
        }
        Video.killClient(client.id, client.name);
    };



    Network.client.exports.spawnPlayer = function (client, isNewPlayer) {
        console.log('Spawn new player >> ', client.name, 'is new player ? ', isNewPlayer);
        if (Network.isMine(client.id)) return; //this is me

        var p = Cursor.new(client);
        playerList[client.id] = p;

        UI.message(client.name, 'joined the table!');
        UI.updateNames();

        Video.newClient(client.id, client.name);
        // Video.newClient('asgasgasgasg', 'suzi');
    };



    Network.client.exports.updateCursor = function (client, state) {
        if (Network.isMine(client.id)) return; // this is me //////////////
        if (playerList[client.id]) {
            playerList[client.id].x = state.x;
            playerList[client.id].y = state.y;
        }
    };

    /******************* TILES ******************/


    Network.client.exports.dragTile = function (client, tileId) {
        console.log(client.name  + ' drags tile ', tileId);
        if (Network.isMine(client.id)) return; // this is me //////////////
        var tile = G.findTile(tileId);
        if(tile.defaultFrame) T.show(tile);
        Controls.hide(tile);
        G.addUpdatePosition({follower: tile, target: playerList[client.id]});
    };

    Network.client.exports.positionTile = function (client, tileId, newPosition) {
        console.log('Initial positioning of tile ', tileId);
        if (! Network.isMine(client.id)) return; // this is NOT me ////////
        
        var tile = G.findTile(tileId);
        Controls.hide(tile);
        
        R.compose(T.enableInput, T.show)(tile);
        
        Utils.alignPosRot(tile, newPosition);
        UI.message('Positioning tile', tileId);
    };


    Network.client.exports.dropTile = function (client, tileId, newPosition) {
        console.log(client.name + ' drops tile ', tileId, 'at', newPosition);
        var tile = G.findTile(tileId);
        S.removeCardFromStacks(tileId);

        if (Network.isMine(client.id)) return; // this is me //////////////
        
        Controls.hide(tile);
        
        UI.message(client.name, 'moved tile', tile.id);
        G.removeUpdatePosition(playerList[client.id]);
        
        Utils.alignPosRot(tile, newPosition);
    };


    /******************* STACKS ******************/

    Network.client.exports.dragStack = function (client, stackId) {
        console.log(client.name  + ' drags stack ', stackId);
        if (Network.isMine(client.id)) return; //this is me
        var stack = G.findStack(stackId);
        stack.remoteDragged = true;
        G.addUpdatePosition({follower: stack, target: playerList[client.id]});
    };


    Network.client.exports.dropStack = function (client, stackId, newPosition) {
        console.log(client.name + ' moved stack ', stackId);
        if (Network.isMine(client.id)) return; //this is me
        var stack = G.findStack(stackId);
        G.removeUpdatePosition(playerList[client.id]);
        stack.remoteDragged = false;

        Utils.alignPosRot(stack, newPosition);

        S.tidy(stack);
        UI.message(client.name, 'moved stack', stackId);
    };


    Network.client.exports.positionStack = function (client, stackId, stackData) {
        console.log(client.name + ' moved stack ', stackId);
        if (!Network.isMine(client.id)) return; //this is NOT me
        
        var stack = G.findStack(stackId);
        Utils.alignPosRot(stack, stackData.position);
        console.log('adding', stackData.cards, 'to stack', stackId);
        S.updateCards(stack, stackData.cards);

        S.alignElements(stack);
        UI.message('Positioning stack', stackId);
    };


    Network.client.exports.updateStackCards = function (client, stackId, cards) {
        console.log('updateCards', cards, 'toStack', stackId);
        G.removeUpdatePosition(playerList[client.id]);
        var updatedStack = G.findStack(stackId);
        S.updateCards(updatedStack, cards);
    };

    Network.client.exports.flipStack = function(client, stackId) {
        var stack = G.findStack(stackId);
        S.flipCards(stack);
    };




    /******************* DICE ******************/

    Network.client.exports.spin = function(client, diceInGroup, delays, values) {
        Dice.spin(diceInGroup, delays, values);
    };


    /******************* DICE ******************/

    Network.client.exports.receiveChat = function(client, text) {
        console.log(client.name, 'says', text);
        UI.message(client.name, ':', text);
    };
};

