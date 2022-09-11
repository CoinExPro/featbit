import {Component, EventEmitter, Input, Output} from '@angular/core';
import {
  EffectEnum,
  IamPolicyAction,
  Resource,
  resourceActionsDict,
  resourcesTypes,
  ResourceType,
  ResourceTypeEnum
} from "@features/safe/iam/components/policy-editor/types";
import {encodeURIComponentFfc, uuidv4} from "@utils/index";
import {IPolicy, IPolicyStatement} from "@features/safe/iam/types/policy";
import {NzMessageService} from "ng-zorro-antd/message";
import {PolicyService} from "@services/policy.service";
import {Router} from "@angular/router";

class PolicyStatementViewModel {
  id: string;
  resourceType?: ResourceType = null;
  effect: EffectEnum = EffectEnum.Allow;
  availableActions: IamPolicyAction[] = [];

  compareResourceType = (o1: ResourceType, o2: ResourceType) => {
    return o1 && o2 && o1.type === o2.type;
  }

  constructor(statement?: IPolicyStatement) {
    this.resourceType = resourcesTypes[0];
    if (statement) {
      this.id = statement.id;
      this.resourceType = resourcesTypes.find(rt => rt.type === statement.resourceType) || null;
      this.effect = statement.effect === 'allow' ? EffectEnum.Allow : EffectEnum.Deny;

      const allActions = Object.keys(resourceActionsDict).flatMap(p => resourceActionsDict[p]);
      this.selectedActions = statement.actions.map(act => {
        const find = allActions.find(a => act === a.name);
        return find || act as unknown as IamPolicyAction;
      });

      this.selectedResources = statement.resources.map(rsc => ({id: uuidv4(), name: rsc, rn: rsc}));
    } else {
      this.id = uuidv4();
      this.effect = EffectEnum.Allow;
      this.selectedActions = [];
      this.selectedResources = [];
    }

    const actionKey = this.resourceType?.type === ResourceTypeEnum.General ?
      `${ResourceTypeEnum.General},${this.selectedResources[0]?.rn}` :
      this.resourceType?.type;

    this.availableActions = resourceActionsDict[actionKey];
  }

  onResourceTypeChange(){
    this.selectedActions = [];
    this.selectedResources = [];

    const actionKey = this.resourceType?.type === ResourceTypeEnum.General ?
      `${ResourceTypeEnum.General},${this.selectedResources[0]?.rn}` :
      this.resourceType?.type;

    this.availableActions = resourceActionsDict[actionKey];
  }

  selectedActions: IamPolicyAction[] = [];
  onSelectedActionsChange(actions: IamPolicyAction[]) {
    this.selectedActions = [...actions];
  }

  selectedResources: Resource[] = [];
  onSelectedResourcesChange(resources: Resource[]) {
    this.selectedResources = [...resources];

    let actionKey: string = this.resourceType?.type;
    if (this.resourceType?.type === ResourceTypeEnum.General) {
      this.selectedActions = [];
      actionKey = `${ResourceTypeEnum.General},${this.selectedResources[0]?.rn}`;
    }

    this.availableActions = resourceActionsDict[actionKey];
  }

  getOutput(): IPolicyStatement {
    return {
      id: this.id,
      resourceType: this.resourceType.type,
      effect: this.effect,
      actions: this.selectedActions.map(act => act.name),
      resources: this.selectedResources.map(rsc => rsc.rn)
    }
  }

  isResourcesInvalid: boolean = false;
  isActionsInvalid: boolean = false;
  validate() {
    this.isResourcesInvalid = this.selectedResources.length === 0;
    this.isActionsInvalid = this.selectedActions.length === 0;
    return this.isResourcesInvalid || this.isActionsInvalid;
  }
}

@Component({
  selector: 'iam-policy-editor',
  templateUrl: './policy-editor.component.html',
  styleUrls: ['./policy-editor.component.less']
})
export class PolicyEditorComponent {

  resourcesTypes: ResourceType[] = resourcesTypes;
  statements: PolicyStatementViewModel[] = [];
  readonly: boolean; // true if FFCManaged

  constructor(
    private router: Router,
    private message: NzMessageService,
    private policyService: PolicyService
  ) { }

  @Output()
  saveStatementsEvent = new EventEmitter<IPolicyStatement[]>();

  private _policy: IPolicy;
  @Input('policy')
  set _(policy: IPolicy) {
    if (policy) {
      this._policy = JSON.parse(JSON.stringify(policy));
      this.readonly = policy.type === 'FFCManaged';
      this.statements = policy.statements.map(statement => new PolicyStatementViewModel(statement));
    }
  }

  copyPolicy() {
    const { name, description, statements } = this._policy;

    this.policyService.create(`${name}_copy`, description).subscribe(
      (p: IPolicy) => {

        this.policyService.updateStatements(p.id, statements).subscribe(() => {
          this.message.success('复制成功！');
          this.router.navigateByUrl(`/iam/policies/${encodeURIComponentFfc(p.id)}/permission`);
        }, _ => this.message.error('复制失败'));
      },
      _ => {
        this.message.success('复制失败！');
      }
    )
  }

  saveStatements() {
    if (this.readonly) {
      this.message.warning('由敏捷开关托管的策略不能被修改');
      return;
    }

    const isInvalid = this.statements.map(statement => statement.validate()).find(v => v);
    if (isInvalid) {
      this.message.error('请确保已设置所有权限的资源和操作');
    } else {
      const payload = this.statements.map(statement => statement.getOutput());
      this.saveStatementsEvent.emit(payload);
    }
  }

  addStatement() {
    this.statements = [...this.statements, new PolicyStatementViewModel()];
  }

  removeStatement(statement: PolicyStatementViewModel) {
    this.statements = this.statements.filter(s => s.id !== statement.id);
  }
}