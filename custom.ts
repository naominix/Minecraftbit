/**
 * Minecraft:bit Custom blocks
 * Require : Minecraft:bit WebSocket Server
 * 
 * Hisashi Hoshino
 */

enum ChoiceCommand {
    //% block="tp"
    tp = 1,
    //% block="give"
    give = 2,
    //% block="execute"
    execute = 3,
    //% block="summon"
    summon = 4,
    //% block="effect"
    effect = 5,
    //% block="fill"
    fill = 6,
    //% block="playsound"
    playsound = 7,
    //% block="weather"
    weather = 8,
    //% block="time"
    time = 9
}

enum Target {
    //% block="すべてのプレイヤー@a"
    a = 1,
    //% block="自分のエージェント@c"
    c = 2,
    //% block="すべてのエンティティ@e"
    e = 3,
    //% block="最も近いプレイヤー@p"
    p = 4,
    //% block="ランダムなプレイヤー@r"
    r = 5,
    //% block="自分自身@s"
    s = 6
}

enum KeyMouseEvent {
    //% block="マウス左ボタンクリック"
    left = 1,
    //% block="マウス右ボタンクリック"
    right = 2,
    //% block="キー[W]"
    w = 3,
    //% block="キー[A]"
    a = 4,
    //% block="キー[S]"
    s = 5,
    //% block="キー[D]"
    d = 6,
    //% block="マウス左ボタンDown"
    L = 7,
    //% block="マウス右ボタンDown"
    R = 8,
    //% block="マウス左ボタンUP"
    j = 9,
    //% block="マウス右ボタンUP"
    k = 10,
}

enum ChoiceEvent {
    //% block="無効：全イベント"
    unsubsc = 0,
    //% block="プレイヤーが歩いた"
    ptravelled = 9,
    // //% block="無効：プレイヤーが歩いた"
    // usptravelled = 1,
    //% block="ブロックを置いた"
    blockplaced = 8,
    // //% block="無効：ブロックを置いた"
    // usblockplaced = 2,
    //% block="ブロックを壊した"
    blockbroken = 7,
    // //% block="無効：ブロックを壊した"
    // usblockbroken = 3,
    //% block="アイテムを使った"
    itemused = 6,
    // //% block="無効：アイテムを使った"
    // usitemused = 4,
    //% block="アイテムを落とした"
    itemdropped = 11,
    // //% block="無効：アイテムを落とした"
    // usitemdropped = 19,
    //% block="メッセージを送信した"
    message = 12,
    // //% block="無効：メッセージを送信した"
    // usmessage = 18,
    //% block="テレポートした"
    teleported = 13
    // //% block="無効：テレポートした"
    // usteleported = 17
}

//% weight=100 color=#0fbc11 icon="\uf1b3"
//% groups='["Connect","Event","Command"]'
namespace Minecraftbit {
    let isConnected: boolean = false;
    let prefix = ":"

    /**
     * Connect Minecraft:bit via USB-Serial
     */
    //% blockId="mcbit_connect" block="🔗Minecraft:bitに接続"
    //% weight=100 color=#000080 blockGap=20
    //% group="Connect"
    export function connect(): void {
        serial.redirectToUSB()
        isConnected = true
        // Baud rate must match the PC side (mcwss-microbit opens the
        // port at 115200). It used to be 9600 here, which only worked
        // because USB CDC largely ignores the setting.
        serial.setBaudRate(BaudRate.BaudRate115200)
        serial.setRxBufferSize(128)
        basic.pause(100)
    }

    /**
         * Write USB-Serial
         */
    //% blockId="serial_write" block="⛏️マイクラコマンド %command を送信"
    //% weight=100 blockGap=20
    //% command.defl="/tp ~~~"
    //% group="Command"
    export function sendMCCommand(command: string): void {
        serial.writeLine(prefix + command)
        basic.pause(100)
    }

    /**
     * TODO: describe your function here
     * @param value describe value here, eg: 5
     */
    //% weight=50
    //% block="⛏️ブロックを壊したとき"
    //% draggableParameters
    //% group="Event"
    export function onBlockBroken(cb: () => void) {
        control.onEvent(11, 22, function () {
            cb()
        })
    }

    /**
     * TODO: describe your function here
     * @param value describe value here, eg: 5
     */
    //% weight=50
    //% block="⛏️ブロックを置いたとき"
    //% draggableParameters
    //% group="Event"
    export function onBlockPlaced(cb: () => void) {
        control.onEvent(12, 22, function () {
            cb()
        })
    }

    /**
     * TODO: describe your function here
     * @param value describe value here, eg: 5
     */
    //% weight=50
    //% block="⛏️アイテムを捨てたとき"
    //% draggableParameters
    //% group="Event"
    export function onItemDropped(cb: () => void) {
        control.onEvent(13, 22, function () {
            cb()
        })
    }

    //% block block="⛏️アイテムを使ったとき"
    //% group="Event"
    export function onItemUsed(cb: () => void): void {
        control.onEvent(14, 22, function () {
            cb()
        })
    }

    //% block block="⛏️プレイヤーがテレポートしたとき"
    //% group="Event"
    export function onTeleported(cb: () => void): void {
        control.onEvent(15, 22, function () {
            cb()
        })
    }

    //% block block="⛏️プレイヤーが歩いたとき"
    //% group="Event"
    export function onTravelled(cb: () => void): void {
        control.onEvent(16, 22, function () {
            cb()
        })
    }

    //% block block="⛏️プレイヤーがメッセージを受信したとき"
    //% group="Event"
    export function onMessage(cb: () => void): void {
        control.onEvent(17, 22, function () {
            cb()
        })
    }

    // Notifications from the PC arrive as newline-terminated lines
    // (the PC side terminates every message since its phase 1
    // hardening). Read one line per notification and dispatch on an
    // exact match. The previous implementation compared the whole
    // receive buffer via serial.readString(), so a trailing newline
    // or two notifications arriving together never matched and the
    // events were silently lost.
    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        let line = serial.readLine()
        // Strip trailing CR/LF in case the line reader keeps them.
        while (line.length > 0 && (line.charAt(line.length - 1) == "\n" || line.charAt(line.length - 1) == "\r")) {
            line = line.substr(0, line.length - 1)
        }
        switch (line) {
            case 'BlockBroken':
                control.raiseEvent(11, 22)
                break;
            case 'BlockPlaced':
                control.raiseEvent(12, 22)
                break;
            case 'ItemDropped':
                control.raiseEvent(13, 22)
                break;
            case 'ItemUsed':
                control.raiseEvent(14, 22)
                break;
            case 'PlayerTeleported':
                control.raiseEvent(15, 22)
                break;
            case ' ':
                control.raiseEvent(16, 22)
                break;
            case 'PlayerMessage':
                control.raiseEvent(17, 22)
                break;
            default:
        }
    })

    /**
     * Run Minecraft Command.
     * @param ChoiceCommand options
     */
    //% blockId=run_mccommand block="⛏️マイクラコマンド実行 %ChoiceCommand | %options"
    //% weight=80
    //% group="Command"
    export function Run_mccommand(choice: ChoiceCommand, options: string):void {
        let commandName
        switch(choice) {
            case ChoiceCommand.tp:
                commandName = "tp"
                break
            case ChoiceCommand.give:
                commandName = "give"
                break
            case ChoiceCommand.execute:
                commandName = "execute"
                break
            case ChoiceCommand.summon:
                commandName = "summon"
                break
            case ChoiceCommand.effect:
                commandName = "effect"
                break
            case ChoiceCommand.fill:
                commandName = "fill"
                break
            case ChoiceCommand.playsound:
                commandName = "playsound"
                break
            case ChoiceCommand.weather:
                commandName = "weather"
                break
            case ChoiceCommand.time:
                commandName = "time"
                break
        }
        let command = "/" + commandName + " " + options
        sendMCCommand(command)
    }

    /**
     * Gathering Minecraft Entity.
     * @param void
     */
    //% blockId=gatheringEntity block="⛏️エンティティ全員集合"
    //% weight=80
    //% group="Command"
    export function gatheringEntity(): void {
        let command = "/tp @e @s"
        sendMCCommand(command)
    }

    /**
     * Run Minecraft Command.
     * @param ChoiceCommand options
     */
    //% blockId=mccommandText block="⛏️マイクラコマンド文字列 %ChoiceCommand | %options"
    //% weight=80
    //% group="Command"
    export function mccommandText(choice: ChoiceCommand, options: string): string {
        let commandName
        switch (choice) {
            case ChoiceCommand.tp:
                commandName = "tp"
                break
            case ChoiceCommand.give:
                commandName = "give"
                break
            case ChoiceCommand.execute:
                commandName = "execute"
                break
            case ChoiceCommand.summon:
                commandName = "summon"
                break
            case ChoiceCommand.effect:
                commandName = "effect"
                break
            case ChoiceCommand.fill:
                commandName = "fill"
                break
            case ChoiceCommand.playsound:
                commandName = "playsound"
                break
            case ChoiceCommand.weather:
                commandName = "weather"
                break
            case ChoiceCommand.time:
                commandName = "time"
                break
        }
        let command = "/" + commandName + " " + options
        return command
    }

    /**
     * Generate Relative coordinates
     * @param ChoiceCommand options
     */
    //% blockId=Rcoordinates block="⛏️相対座標 ~%rx | ~%ry | ~%rz"
    //% weight=80
    //% draggableParameters
    //% group="Command"
    export function setRXYZ(rx: number, ry: number, rz: number):string {
        let RXYZ = "~" + rx + " " + "~" + ry + " " + "~" + rz + " "
        return RXYZ
    }

    /**
     * Generate Relative coordinates
     * @param ChoiceCommand options
     */
    //% blockId=makeMcComStr block="⛏️コマンド文字 %str"
    //% weight=80
    //% draggableParameters
    //% group="Command"
    export function makeMcString(str: string): string {
        let mcStr = " " + str + " "
        return mcStr
    }


    /**
     * Command Target
     * @param Target
     */
    //% blockId=TargetBlock block="⛏️実行対象 %Target"
    //% weight=80
    //% draggableParameters
    //% group="Command"
    export function setTarget(target: Target):string {
        switch (target) {
            case Target.a:
                return " @a ";
            case Target.c:
                return " @c ";
            case Target.e:
                return " @e ";
            case Target.p:
                return " @p ";
            case Target.r:
                return " @r ";
            case Target.s:
                return " @s ";
            default:
                return " @s ";
        }
    }

    /**
     * Command Target with type
     * @param Target
     */
    //% blockId=TargetBlockType block="⛏️実行対象 %Target[type=%type]"
    //% weight=80
    //% draggableParameters
    //% group="Command"
    export function setTargetType(target: Target, type: string): string {
        switch (target) {
            case Target.a:
                return " @a[type=" + type + "] ";
            case Target.c:
                return " @c[type=" + type + "] ";
            case Target.e:
                return " @e[type=" + type + "] ";
            case Target.p:
                return " @p[type=" + type + "] ";
            case Target.r:
                return " @r[type=" + type + "] ";
            case Target.s:
                return " @s[type=" + type + "] ";
            default:
                return " @s[type=" + type + "] ";
        }
    }

    /**
     * Send Minecraft KeyMouseEvent.
     * @param KeyMouseEvent
     */
    //% blockId=send_mckmevent block="⛏️操作イベント送信 %KeyMouseEvent"
    //% weight=80
    //% group="Event"
    /**
    export function send_mcKeyMouseEvent(kmEvent: KeyMouseEvent): void {
        let commandName
        switch (kmEvent) {
            case KeyMouseEvent.left:
                commandName = "l"
                break
            case KeyMouseEvent.right:
                commandName = "r"
                break
            case KeyMouseEvent.w:
                commandName = "w"
                break
            case KeyMouseEvent.a:
                commandName = "a"
                break
            case KeyMouseEvent.s:
                commandName = "s"
                break
            case KeyMouseEvent.d:
                commandName = "d"
                break
            case KeyMouseEvent.L:
                commandName = "L"
                break
            case KeyMouseEvent.R:
                commandName = "R"
                break
            case KeyMouseEvent.j:
                commandName = "j"
                break
            case KeyMouseEvent.k:
                commandName = "k"
                break
        }
        let command = commandName
        sendMCCommand(command)
    }
     */

    /**
     * 
     */
    //% blockId="mcev_choice" block="⛏️イベント選択 %ChoiceEvent"
    //% weight=100 color=#000080 blockGap=20
    //% group="Event"
    export function choiceEvent(cEvent: ChoiceEvent): void {
        let commandName
        switch (cEvent) {
            case ChoiceEvent.unsubsc:
                commandName = "0"
                break
            case ChoiceEvent.ptravelled:
                commandName = "9"
                break
            // case ChoiceEvent.usptravelled:
            //     commandName = "1"
            //     break
            case ChoiceEvent.blockplaced:
                commandName = "8"
                break
            // case ChoiceEvent.usblockplaced:
            //     commandName = "2"
            //     break
            case ChoiceEvent.blockbroken:
                commandName = "7"
                break
            // case ChoiceEvent.usblockbroken:
            //     commandName = "3"
            //     break
            case ChoiceEvent.itemused:
                commandName = "6"
                break
            // case ChoiceEvent.usitemused:
            //     commandName = "4"
            //     break
            case ChoiceEvent.itemdropped:
                commandName = "("
                break
            // case ChoiceEvent.usitemdropped:
            //     commandName = ")"
            //     break
            case ChoiceEvent.message:
                commandName = "["
                break
            // case ChoiceEvent.usmessage:
            //     commandName = "]"
            //     break
            case ChoiceEvent.teleported:
                commandName = "{"
                break
            // case ChoiceEvent.usteleported:
            //     commandName = "}"
            //     break
        }
        sendMCCommand(commandName)
    }
}