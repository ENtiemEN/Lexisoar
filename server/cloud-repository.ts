import type {SupabaseClient} from '@supabase/supabase-js';
import type {Workspace} from './workspace';
export class CloudRepository{
 constructor(private admin:SupabaseClient){}
 async load(owner:string){const {data,error}=await this.admin.from('lexisoar_workspaces').select('revision,state,import_hash').eq('user_id',owner).maybeSingle();if(error)throw Error('Could not load your saved work. Try again.');return data?{revision:Number(data.revision),state:data.state as Partial<Workspace>,importHash:data.import_hash as string|null}:{revision:-1,state:{},importHash:null};}
 async commit(owner:string,revision:number,state:Workspace,importHash:string|null){const {data,error}=await this.admin.rpc('commit_lexisoar_workspace',{p_user_id:owner,p_revision:revision,p_state:state,p_import_hash:importHash});if(error){if(error.message.includes('workspace_conflict'))throw Object.assign(Error('Your work changed in another tab or device. Reload before continuing; your unsent draft remains on this device.'),{statusCode:409});throw Error('The server could not confirm saving. Your draft remains on this device.');}return Number(data);}
}
