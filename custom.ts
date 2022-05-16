/**
 * Minecraft:bit Custom blocks
 * Require : Minecraft:bit WebSocket Server
 * 
 * Hisashi Hoshino
 */

enum ChoiceCommand {
    //% block="tp"
    tp,
    //% block="give"
    give,
    //% block="execute"
    execute,
    //% block="summon"
    summon,
    //% block="effect"
    effect,
    //% block="fill"
    fill,
    //% block="playsound"
    playsound,
    //% block="weather"
    weather,
    //% block="time"
    time
}

enum Target {
    //% block="@aすべてのプレイヤー"
    "a",
    //% block="@c自分のエージェント"
    "c",
    //% block="@eすべてのエンティティ"
    "e",
    //% block="@p最も近いプレイヤー"
    "p",
    //% block="@rランダムなプレイヤー"
    "r",
    //% block="@s自分自身"
    "s"
}

//% weight=100 color=#0fbc11 icon="\uf1b3"
namespace Minecraftbit {
    let isConnected: boolean = false;
    let recvTxt = ""

    /**
     * Connect Minecraft:bit via USB-Serial
     */
    //% blockId="mcbit_connect" block="🔗Minecraft:bitに接続"
    //% weight=100 color=#000080 blockGap=20
    export function connect(): void {
        serial.redirectToUSB()
        isConnected = true
        serial.setBaudRate(BaudRate.BaudRate115200)
        basic.pause(100)
    }

    /**
         * Write USB-Serial
         */
    //% blockId="serial_write" block="⛏️マイクラコマンド %command を送信"
    //% weight=100 blockGap=20
    //% command.defl="/tp ~~~"
    export function sendMCCommand(command: string): void {
        serial.writeLine(command)
    }

    /**
     * TODO: describe your function here
     * @param value describe value here, eg: 5
     */
    //% weight=50
    //% block="⛏️ブロックを壊したとき"
    //% draggableParameters
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
    export function onItemDropped(cb: () => void) {
        control.onEvent(13, 22, function () {
            cb()
        })
    }

    //% block block="⛏️アイテムを使ったとき"
    export function onItemUsed(cb: () => void): void {
        control.onEvent(14, 22, function () {
            cb()
        })
    }

    //% block block="⛏️プレイヤーがテレポートしたとき"
    export function onTeleported(cb: () => void): void {
        control.onEvent(15, 22, function () {
            cb()
        })
    }

    //% block block="⛏️プレイヤーが歩いたとき"
    export function onTravelled(cb: () => void): void {
        control.onEvent(16, 22, function () {
            cb()
        })
    }

    basic.forever(() => {
        recvTxt = serial.readString()
        switch (recvTxt) {
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
            default:

        }
        basic.pause(5);
    })

    /**
     * Run Minecraft Command.
     * @param ChoiceCommand options
     */
    //% blockId=run_mccommand block="⛏️マイクラコマンド実行 %ChoiceCommand | %options"
    //% weight=80
    export function Run_mccommand(choice: ChoiceCommand, options: string):void {
        let command = "/" + choice + " " + options
        sendMCCommand(command)
    }

    /**
     * Generate Relative coordinates
     * @param ChoiceCommand options
     */
    //% blockId=Rcoordinates block="⛏️相対座標 ~%rx | ~%ry | ~%rz"
    //% weight=80
    //% draggableParameters
    export function setRXYZ(rx: number, ry: number, rz: number):string {
        let RXYZ = "~" + rx + " " + "~" + ry + " " + "~" + rz + " "
        return RXYZ
    }

    /**
     * Command Target
     * @param Target
     */
    //% blockId=TargetBlock block="⛏️実行対象 %Target"
    //% weight=80
    //% draggableParameters
    export function setTarget(target: Target):string {
        let targetStr: string = ""
        switch (target) {
            case Target.a:
                targetStr = " @a "
                return targetStr;
                break
            case Target.c:
                targetStr = " @c "
                return targetStr;
            case Target.e:
                targetStr = " @e "
                return targetStr;
            case Target.p:
                targetStr = " @p "
                return targetStr;
            case Target.r:
                targetStr = " @r "
                return targetStr;
            case Target.s:
                targetStr = " @s "
                return targetStr;
            default:
                targetStr = " @s "
                return targetStr;
        }
    }
}