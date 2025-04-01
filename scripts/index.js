//@ts-check
import { world, system, BlockPermutation } from '@minecraft/server';
import { MinecraftBlockTypes, MinecraftItemTypes } from './lib/index.js';

const mossyBlocks = [
    "",
    MinecraftBlockTypes.Cobblestone,
    MinecraftBlockTypes.CobblestoneSlab,
    MinecraftBlockTypes.StoneStairs,
    MinecraftBlockTypes.CobblestoneWall,
    MinecraftBlockTypes.StoneBricks,
    MinecraftBlockTypes.StoneBrickSlab,
    MinecraftBlockTypes.StoneBrickStairs,
    MinecraftBlockTypes.StoneBrickWall,
];

world.beforeEvents.playerInteractWithBlock.subscribe((ev)=>{
    const { block, isFirstEvent, itemStack, player } = ev;

    if(!isFirstEvent) return;

    //染料
    if(itemStack?.typeId.endsWith("_dye")){
        const blockColor = block.permutation.getState("color");
        let dyeColor = itemStack?.typeId.replace("minecraft:","").replace("_dye","");
        let blockType = "";

        if(dyeColor){
            if(dyeColor === "light_gray") dyeColor = "silver"
            
            if(blockColor){
                if(blockColor === dyeColor) return;

                if(!block.typeId.includes("shulker_box") && !block.typeId.includes("glass")){
                    system.run(()=>{
                        if(itemStack.amount > 1){
                            itemStack.amount--;
                            player.getComponent("inventory")?.container?.setItem(player.selectedSlotIndex, itemStack);
                        }
                        
                        else{
                            player.getComponent("inventory")?.container?.setItem(player.selectedSlotIndex);
                        }
                    });
                    
                    if(block.typeId.includes("wool")) blockType = MinecraftBlockTypes.WhiteWool; //ウール
                    else if(block.typeId.includes("carpet")) blockType = MinecraftBlockTypes.WhiteCarpet; //カーペット
                    else if(block.typeId.includes("concrete_powder")) blockType = MinecraftBlockTypes.WhiteConcretePowder; //コンクリートパウダー
                    else if(block.typeId.includes("concrete")) blockType = MinecraftBlockTypes.WhiteConcrete; //コンクリート
                    else if(block.typeId.includes("terracotta")) blockType = MinecraftBlockTypes.WhiteTerracotta; //テラコッタ

                    ev.cancel = true;
                    system.run(()=>{
                        if(blockType.includes("glazed_terracotta")) block.setType(blockType);
                        else block.setPermutation(BlockPermutation.resolve(blockType, { color: dyeColor }));
                    });
                }
            }

            //シュルカーボックス
            if(block.typeId.includes("shulker_box")) {
                ev.cancel = true;
                blockType = MinecraftBlockTypes.WhiteShulkerBox;

                if(blockColor && blockColor === dyeColor) return;

                system.run(()=>{
                    if(itemStack.amount > 1){
                        itemStack.amount--;
                        player.getComponent("inventory")?.container?.setItem(player.selectedSlotIndex, itemStack);
                    }
                    
                    else{
                        player.getComponent("inventory")?.container?.setItem(player.selectedSlotIndex);
                    }

                    block.setPermutation(BlockPermutation.resolve(blockType, { color: dyeColor }));
                });
            }

            if(block.typeId.includes("glass_pane")) {
                blockType = MinecraftBlockTypes.WhiteStainedGlassPane;

                if(blockColor && blockColor === dyeColor) return;

                system.run(()=>{
                    if(itemStack.amount > 1){
                        itemStack.amount--;
                        player.getComponent("inventory")?.container?.setItem(player.selectedSlotIndex, itemStack);
                    }
                    
                    else{
                        player.getComponent("inventory")?.container?.setItem(player.selectedSlotIndex);
                    }

                    block.setPermutation(BlockPermutation.resolve(blockType, { color: dyeColor }));
                });
            }

            else if(block.typeId.includes("glass")){
                if(itemStack.typeId === MinecraftItemTypes.AmethystShard){
                    blockType = MinecraftBlockTypes.TintedGlass;

                }

                blockType = MinecraftBlockTypes.WhiteStainedGlass;

                if(blockColor && blockColor === dyeColor) return;

                system.run(()=>{
                    if(itemStack.amount > 1){
                        itemStack.amount--;
                        player.getComponent("inventory")?.container?.setItem(player.selectedSlotIndex, itemStack);
                    }
                    
                    else{
                        player.getComponent("inventory")?.container?.setItem(player.selectedSlotIndex);
                    }

                    block.setPermutation(BlockPermutation.resolve(blockType, { color: dyeColor }));
                });
            }

            if(block.typeId.includes("glazed_terracotta")){
                const facingDirection = block.permutation.getState("facing_direction");
                blockType = `minecraft:${dyeColor}_glazed_terracotta`;
                
                system.run(()=>{
                    if(facingDirection) block.setPermutation(BlockPermutation.resolve(blockType, { facing_direction: facingDirection }));
                });
            }

            if(block.typeId.includes("candle_cake")){
                const lit = block.permutation.getState("lit");
                blockType = `minecraft:${dyeColor}_candle_cake`;
                
                ev.cancel = true;
                system.run(()=>{
                    if(lit != undefined) {
                        block.setPermutation(BlockPermutation.resolve(blockType, { lit: lit }));
                    }
                });
            }

            else if(block.typeId.includes("candle")){
                const lit = block.permutation.getState("lit");
                const candles = block.permutation.getState("candles");
                blockType = `minecraft:${dyeColor}_candle`;
                
                ev.cancel = true;
                system.run(()=>{
                    if(lit != undefined && candles != undefined) {
                        world.sendMessage("a")
                        block.setPermutation(BlockPermutation.resolve(blockType, { lit: lit, candles: candles }));
                    }
                });
            }
        }
    }

    //つた
    if(itemStack?.typeId === "minecraft:vine" && player.isSneaking){
        if(mossyBlocks.includes(block.typeId)){
            ev.cancel = true;

            let blockId;
            let states = {};

            switch(block.typeId){
                case MinecraftBlockTypes.Cobblestone: {
                    blockId = MinecraftBlockTypes.MossyCobblestone;
                    
                    break;
                }
                    
                case MinecraftBlockTypes.CobblestoneSlab: {
                    const topSlotBit = block.permutation.getState("top_slot_bit");
                    const verticalHalf = block.permutation.getState("minecraft:vertical_half");
    
                    states = { 
                        top_slot_bit: topSlotBit, 
                        "minecraft:vertical_half": verticalHalf
                    };

                    break;
                }
                   
                case MinecraftBlockTypes.StoneStairs: {
                    blockId = MinecraftBlockTypes.MossyCobblestoneStairs;

                    const upsideDownBit = block.permutation.getState("upside_down_bit");
                    const weirdoDirection = block.permutation.getState("weirdo_direction");
    
                    states = { 
                        upside_down_bit: upsideDownBit, 
                        weirdo_direction: weirdoDirection
                    };

                    break;
                }
                    
                case MinecraftBlockTypes.CobblestoneWall: {
                    blockId = MinecraftBlockTypes.CobblestoneWall;

                    const wallPostBit = block.permutation.getState("wall_post_bit");
                    const east = block.permutation.getState("wall_connection_type_east");
                    const north = block.permutation.getState("wall_connection_type_north");
                    const south = block.permutation.getState("wall_connection_type_south");
                    const west = block.permutation.getState("wall_connection_type_west");
    
                    states = { 
                        wall_block_type: "mossy_cobblestone", 
                        wall_post_bit: wallPostBit,
                        wall_connection_type_east: east,
                        wall_connection_type_north: north,
                        wall_connection_type_south: south,
                        wall_connection_type_west: west,
                    };
    
                    break;
                }
                    
                case MinecraftBlockTypes.StoneBricks: {
                    blockId = MinecraftBlockTypes.StoneBricks;
                    states = { stone_brick_type: "mossy" };

                    break;
                }
                    
                case MinecraftBlockTypes.StoneBrickSlab: {
                    blockId = MinecraftBlockTypes.MossyStoneBrickSlab;

                    const topSlotBit = block.permutation.getState("top_slot_bit");
                    const verticalHalf = block.permutation.getState("minecraft:vertical_half");

                    states = { 
                        top_slot_bit: topSlotBit, 
                        "minecraft:vertical_half": verticalHalf
                    };
    
                    break;
                }
                    
                case MinecraftBlockTypes.StoneBrickStairs: {
                    blockId = MinecraftBlockTypes.MossyStoneBrickStairs;
    
                    const upsideDownBit = block.permutation.getState("upside_down_bit");
                    const weirdoDirection = block.permutation.getState("weirdo_direction");
    
                    states = { 
                        upside_down_bit: upsideDownBit, 
                        weirdo_direction: weirdoDirection
                    };
                    
                    break;
                }
        
                case MinecraftBlockTypes.StoneBrickWall: {
                    blockId = MinecraftBlockTypes.StoneBrickWall;
    
                    const wallPostBit = block.permutation.getState("wall_post_bit");
                    const east = block.permutation.getState("wall_connection_type_east");
                    const north = block.permutation.getState("wall_connection_type_north");
                    const south = block.permutation.getState("wall_connection_type_south");
                    const west = block.permutation.getState("wall_connection_type_west");
    
                    states = { 
                        wall_block_type: "mossy_stone_brick", 
                        wall_post_bit: wallPostBit,
                        wall_connection_type_east: east,
                        wall_connection_type_north: north,
                        wall_connection_type_south: south,
                        wall_connection_type_west: west,
                    };

                    system.run(()=>{
                        block.setPermutation(BlockPermutation.resolve(MinecraftBlockTypes.StoneBrickWall, states));
                    });
    
                    break;
                }
            }

            if(blockId) block.setPermutation(BlockPermutation.resolve(blockId, states));
        }
    }
});